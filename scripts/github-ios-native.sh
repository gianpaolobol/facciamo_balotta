#!/usr/bin/env bash
# Native Xcode compilation: no EAS CLI, EXPO_TOKEN or Expo service requests.
set -euo pipefail
umask 077
test "$(uname -s)" = Darwin || { echo "A macOS Xcode runner is required" >&2; exit 1; }
: "${RUNNER_TEMP:?}" "${GITHUB_RUN_NUMBER:?}" "${GITHUB_RUN_ATTEMPT:?}" "${GITHUB_SHA:?}"
: "${IOS_DISTRIBUTION_P12_BASE64:?}" "${IOS_DISTRIBUTION_P12_PASSWORD:?}" "${IOS_APP_STORE_PROFILE_BASE64:?}"
case "${UPLOAD_TESTFLIGHT:-false}" in true|false) ;; *) echo "Invalid upload flag" >&2; exit 1;; esac
case "$GITHUB_RUN_NUMBER" in ''|*[!0-9]*) echo "Invalid run number" >&2; exit 1;; esac
case "$GITHUB_RUN_ATTEMPT" in ''|*[!0-9]*) echo "Invalid run attempt" >&2; exit 1;; esac
test "$GITHUB_RUN_ATTEMPT" -lt 100
build_number=$((1000 + 100 * GITHUB_RUN_NUMBER + GITHUB_RUN_ATTEMPT))
secret_dir=$(mktemp -d "$RUNNER_TEMP/balotta-signing.XXXXXX")
keychain="$secret_dir/build.keychain-db"
keychain_password=$(openssl rand -hex 32)
installed_profile=""
installed_profile_modern=""
cleanup() {
  [ -z "$installed_profile" ] || rm -f "$installed_profile"
  [ -z "$installed_profile_modern" ] || rm -f "$installed_profile_modern"
  security delete-keychain "$keychain" >/dev/null 2>&1 || true
  rm -rf "$secret_dir"
}
trap cleanup EXIT
export BALOTTA_SIGNING_DIR="$secret_dir" BALOTTA_BUILD_NUMBER="$build_number"
python3 - <<'PY'
import base64, os
from pathlib import Path
root=Path(os.environ['BALOTTA_SIGNING_DIR'])
for name,filename in [('IOS_DISTRIBUTION_P12_BASE64','distribution.p12'),('IOS_APP_STORE_PROFILE_BASE64','app.mobileprovision')]:
    (root/filename).write_bytes(base64.b64decode(''.join(os.environ[name].split()),validate=True))
PY
security cms -D -i "$secret_dir/app.mobileprovision" > "$secret_dir/profile.plist"
python3 - <<'PY'
import datetime,hashlib,os,plistlib,re
from pathlib import Path
root=Path(os.environ['BALOTTA_SIGNING_DIR'])
p=plistlib.loads((root/'profile.plist').read_bytes())
e=p['Entitlements']
assert p['TeamIdentifier']==['BX9MDXAHKG'],'Wrong Apple team'
assert e['application-identifier']=='BX9MDXAHKG.it.facciamobalotta.app','Wrong app profile'
assert e.get('get-task-allow',False) is False,'Development profile rejected'
assert 'ProvisionedDevices' not in p and not p.get('ProvisionsAllDevices'),'App Store profile required'
assert p['ExpirationDate']>datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),'Expired profile'
assert re.fullmatch(r'[A-Fa-f0-9-]{36}',p['UUID']),'Invalid profile UUID'
assert e.get('com.apple.developer.applesignin')==['Default'],'Sign in with Apple missing'
assert e.get('aps-environment')=='production','Distribution push entitlement missing'
assert len(p.get('DeveloperCertificates',[]))==1,'Single distribution identity required'
sha1=hashlib.sha1(p['DeveloperCertificates'][0]).hexdigest().upper()
(root/'profile-uuid').write_text(p['UUID'])
(root/'profile-name').write_text(p['Name'])
(root/'certificate-sha1').write_text(sha1)
options={'method':'app-store-connect','destination':'export','teamID':'BX9MDXAHKG','signingStyle':'manual',
 'signingCertificate':sha1,'provisioningProfiles':{'it.facciamobalotta.app':p['Name']},
 'manageAppVersionAndBuildNumber':False,'uploadSymbols':True}
(root/'ExportOptions.plist').write_bytes(plistlib.dumps(options))
entitlements=Path('ios/FacciamoBalotta/FacciamoBalotta.entitlements')
native=plistlib.loads(entitlements.read_bytes())
assert native.get('com.apple.developer.applesignin')==['Default'],'Native Apple sign-in entitlement missing'
native['aps-environment']='production'
entitlements.write_bytes(plistlib.dumps(native))
PY
profile_uuid=$(cat "$secret_dir/profile-uuid")
profile_dir="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$profile_dir"
profile_path="$profile_dir/$profile_uuid.mobileprovision"
# Never replace a pre-existing profile, even on an ephemeral runner.
test ! -e "$profile_path"
cp "$secret_dir/app.mobileprovision" "$profile_path"
installed_profile="$profile_path"
profile_modern_dir="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
mkdir -p "$profile_modern_dir"
profile_modern_path="$profile_modern_dir/$profile_uuid.mobileprovision"
test ! -e "$profile_modern_path"
cp "$secret_dir/app.mobileprovision" "$profile_modern_path"
installed_profile_modern="$profile_modern_path"
security create-keychain -p "$keychain_password" "$keychain"
security set-keychain-settings -lut 7200 "$keychain"
security unlock-keychain -p "$keychain_password" "$keychain"
# Apple Security.framework cannot import every OpenSSL 3 PKCS#12 algorithm.
# Keep the strong original in GitHub; convert only inside this private temporary directory.
openssl pkcs12 -in "$secret_dir/distribution.p12" -passin env:IOS_DISTRIBUTION_P12_PASSWORD \
  -nodes -out "$secret_dir/identity.pem"
openssl pkcs12 -export -in "$secret_dir/identity.pem" -out "$secret_dir/apple-import.p12" \
  -passout env:IOS_DISTRIBUTION_P12_PASSWORD -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1
rm -f "$secret_dir/identity.pem"
security import "$secret_dir/apple-import.p12" -k "$keychain" -P "$IOS_DISTRIBUTION_P12_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security >/dev/null
rm -f "$secret_dir/apple-import.p12"
security set-key-partition-list -S apple-tool:,apple: -k "$keychain_password" "$keychain" >/dev/null
security list-keychains -d user -s "$keychain" "$HOME/Library/Keychains/login.keychain-db"
certificate_sha1=$(cat "$secret_dir/certificate-sha1")
security find-identity -v -p codesigning "$keychain" > "$secret_dir/identities.txt"
grep -Fq "$certificate_sha1" "$secret_dir/identities.txt" || { echo "Certificate/private key does not match provisioning profile" >&2; exit 1; }
node --input-type=module <<'JS'
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),xcode=require('xcode');
const root=process.env.BALOTTA_SIGNING_DIR,file='ios/FacciamoBalotta.xcodeproj/project.pbxproj';
const project=xcode.project(file);project.parseSync();
const plain=x=>typeof x==='string'?x.replace(/^"|"$/g,''):x;
const targets=Object.values(project.pbxNativeTargetSection()).filter(t=>t&&plain(t.productType)==='com.apple.product-type.application');
if(targets.length!==1)throw Error('Unexpected application targets');
const configurations=project.pbxXCConfigurationList()[targets[0].buildConfigurationList].buildConfigurations;
for(const entry of configurations){
 const settings=project.pbxXCBuildConfigurationSection()[entry.value].buildSettings;
 if(plain(settings.PRODUCT_BUNDLE_IDENTIFIER)!=='it.facciamobalotta.app')throw Error('Unexpected bundle identifier');
 Object.assign(settings,{CODE_SIGN_STYLE:'Manual',DEVELOPMENT_TEAM:'BX9MDXAHKG',
  CODE_SIGN_IDENTITY:fs.readFileSync(root+'/certificate-sha1','utf8'),
  PROVISIONING_PROFILE_SPECIFIER:JSON.stringify(fs.readFileSync(root+'/profile-name','utf8')),
  CURRENT_PROJECT_VERSION:process.env.BALOTTA_BUILD_NUMBER});
}
fs.writeFileSync(file,project.writeSync());
JS
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $build_number" ios/FacciamoBalotta/Info.plist
out="$PWD/artifacts/ios"
mkdir -p "$out"
xcodebuild -version
xcodebuild -workspace ios/FacciamoBalotta.xcworkspace -scheme FacciamoBalotta -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$secret_dir/FacciamoBalotta.xcarchive" archive
xcodebuild -exportArchive -archivePath "$secret_dir/FacciamoBalotta.xcarchive" \
  -exportOptionsPlist "$secret_dir/ExportOptions.plist" -exportPath "$out"
app="$secret_dir/FacciamoBalotta.xcarchive/Products/Applications/FacciamoBalotta.app"
codesign --verify --deep --strict "$app"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Info.plist")" = it.facciamobalotta.app
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$app/Info.plist")" = "$build_number"
ipa="$out/FacciamoBalotta.ipa"
test -s "$ipa"
(cd "$out" && shasum -a 256 FacciamoBalotta.ipa > SHA256SUMS.txt)
unzip -q "$ipa" -d "$secret_dir/exported"
exported_app="$secret_dir/exported/Payload/FacciamoBalotta.app"
codesign --verify --deep --strict "$exported_app"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$exported_app/Info.plist")" = it.facciamobalotta.app
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$exported_app/Info.plist")" = "$build_number"
python3 scripts/verify-ios-linkage.py "$exported_app"
printf 'signed_artifact_ready=true\n' >> "${GITHUB_OUTPUT:?}"
if [ "${UPLOAD_TESTFLIGHT:-false}" = true ]; then
  : "${ASC_API_KEY_P8:?}"
  mkdir "$secret_dir/private_keys"
  printf '%s\n' "$ASC_API_KEY_P8" > "$secret_dir/private_keys/AuthKey_SHK6U3T299.p8"
  openssl pkey -in "$secret_dir/private_keys/AuthKey_SHK6U3T299.p8" -check -noout >/dev/null
  (cd "$secret_dir" && xcrun altool --upload-app --type ios --file "$ipa" \
    --apiKey SHK6U3T299 --apiIssuer 8f57d241-76f9-4226-a912-f2ef24ac1a92)
fi
{
  echo "### Facciamo Balotta - native iOS"
  echo "Source: $GITHUB_SHA; build: $build_number; bundle: it.facciamobalotta.app"
  echo "Xcode archive/export and local signature checks passed."
  echo "Apple upload requested: ${UPLOAD_TESTFLIGHT:-false}."
  echo "Apple processing and availability to testers require separate verification."
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
