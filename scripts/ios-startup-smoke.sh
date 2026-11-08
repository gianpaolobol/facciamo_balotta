#!/usr/bin/env bash
set -euo pipefail
out="$PWD/artifacts/ios-startup"
mkdir -p "$out"
xcodebuild -version > "$out/xcode-version.txt"
xcrun simctl list devices available -j > "$out/devices.json"
python3 - "$out" <<'PY'
import json,re,sys
from pathlib import Path
out=Path(sys.argv[1]);data=json.loads((out/'devices.json').read_text())
choices=[]
for runtime,devices in data['devices'].items():
    match=re.search(r'iOS-(\d+)-(\d+)',runtime)
    if not match:continue
    for device in devices:
        if device.get('isAvailable') and device['name'].startswith('iPhone'):
            choices.append((tuple(map(int,match.groups())),device['name'],device['udid'],runtime))
if not choices:raise SystemExit('No available iPhone Simulator')
version,name,udid,runtime=sorted(choices)[0]
(out/'device-uuid').write_text(udid)
(out/'selected-device.json').write_text(json.dumps({'name':name,'runtime':runtime,'udid':udid},indent=2))
print('Selected',name,runtime)
PY
uuid=$(cat "$out/device-uuid")
xcodebuild -workspace ios/FacciamoBalotta.xcworkspace -scheme FacciamoBalotta \
  -configuration Release -sdk iphonesimulator -destination "id=$uuid" \
  -derivedDataPath "$RUNNER_TEMP/balotta-startup-derived" CODE_SIGNING_ALLOWED=NO build \
  > "$out/build.log" 2>&1 || { tail -n 100 "$out/build.log"; exit 1; }
app="$RUNNER_TEMP/balotta-startup-derived/Build/Products/Release-iphonesimulator/FacciamoBalotta.app"
test -s "$app/main.jsbundle"
cp "$app/Info.plist" "$out/Info.plist"
xcrun simctl boot "$uuid" || true
xcrun simctl bootstatus "$uuid" -b
xcrun simctl install "$uuid" "$app"
xcrun simctl launch --console-pty --terminate-running-process "$uuid" it.facciamobalotta.app \
  > "$out/app-console.log" 2>&1 &
launch_client=$!
sleep 25
alive=false
if kill -0 "$launch_client" 2>/dev/null; then alive=true; fi
xcrun simctl io "$uuid" screenshot "$out/launch.png" || true
xcrun simctl spawn "$uuid" launchctl list > "$out/processes.txt" || true
xcrun simctl spawn "$uuid" log show --last 3m --style compact \
  --predicate 'process == "FacciamoBalotta" OR eventMessage CONTAINS "it.facciamobalotta.app"' \
  > "$out/runtime.log" 2>&1 || true
python3 - "$out" "$uuid" <<'PY'
import glob,os,shutil,sys
from pathlib import Path
out=Path(sys.argv[1]);dest=out/'crash-reports';dest.mkdir(exist_ok=True)
for directory in [Path.home()/'Library/Logs/DiagnosticReports',Path.home()/f'Library/Developer/CoreSimulator/Devices/{sys.argv[2]}/data/Library/Logs/CrashReporter']:
    if directory.exists():
        for path in directory.glob('FacciamoBalotta*'):
            if path.is_file():shutil.copy2(path,dest/path.name)
PY
if [ "$alive" != true ]; then
  echo 'Release app exited during the first 25 seconds; inspect app-console.log and crash-reports.' >&2
  tail -n 100 "$out/app-console.log"
  exit 1
fi
if ! grep -F 'it.facciamobalotta.app' "$out/processes.txt" >/dev/null; then
  echo 'App process not present after launch; inspect screenshot and runtime log.' >&2
  exit 1
fi
echo 'Release process remained alive for 25 seconds; screenshot must be visually checked.'
xcrun simctl terminate "$uuid" it.facciamobalotta.app || true
wait "$launch_client" || true
