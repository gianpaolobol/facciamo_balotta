import zipfile,struct,sys,plistlib
from pathlib import Path
# Audit strong two-level native imports against the bundled framework exports.
# This checks app frameworks, not symbols supplied by the operating system.
source=Path(sys.argv[1])
if source.is_dir():
 root=source
 executable=plistlib.loads((root/'Info.plist').read_bytes())['CFBundleExecutable']
 paths=[executable]+[str(p.relative_to(root)) for p in (root/'Frameworks').glob('*.framework/*') if p.name==p.parent.stem]
 read=lambda p:(root/p).read_bytes()
else:
 z=zipfile.ZipFile(source)
 info=next(p for p in z.namelist() if p.startswith('Payload/') and p.count('/')==2 and p.endswith('/Info.plist'))
 root=info.removesuffix('Info.plist')
 executable=plistlib.loads(z.read(info))['CFBundleExecutable']
 paths=[executable]+[p.removeprefix(root) for p in z.namelist() if p.startswith(root+'Frameworks/') and '.framework/' in p and p.split('/')[-1]==p.split('/')[-2].replace('.framework','')]
 read=lambda p:z.read(root+p)
images={}
def uleb(d,o):
 v=0;s=0
 while True:
  b=d[o];o+=1;v|=(b&127)<<s
  if not b&128:return v,o
  s+=7
for p in paths:
 d=read(p)
 if d[:4]==b'\xca\xfe\xba\xbe':d=d[struct.unpack_from('>I',d,16)[0]:]
 assert d[:4]==b'\xcf\xfa\xed\xfe'
 n=struct.unpack_from('<I',d,16)[0];o=32;libs=[];exports=set();symtab=None;expoff=None
 for _ in range(n):
  cmd,size=struct.unpack_from('<II',d,o)
  if cmd in [0xc,0x80000018,0x8000001f,0x80000023]:
   pos=struct.unpack_from('<I',d,o+8)[0];libs.append(d[o+pos:o+size].split(b'\0')[0].decode())
  if cmd==2:symtab=struct.unpack_from('<IIII',d,o+8)
  if cmd==0x80000033:expoff=struct.unpack_from('<I',d,o+8)[0]
  if cmd in [0x22,0x80000022] and expoff is None:expoff=struct.unpack_from('<I',d,o+40)[0]
  o+=size
 if expoff:
  def visit(offset,prefix):
   pos=expoff+offset;length,pos=uleb(d,pos)
   if length:exports.add(prefix)
   pos+=length;children=d[pos];pos+=1
   for _ in range(children):
    end=d.index(0,pos);edge=d[pos:end].decode();pos=end+1;child,pos=uleb(d,pos);visit(child,prefix+edge)
  visit(0,'')
 imports=[]
 if symtab:
  off,count,strings,stringsize=symtab
  for j in range(count):
   strx,typ,sect,desc,value=struct.unpack_from('<IBBHQ',d,off+j*16)
   if typ&0xe==0 and typ&1 and not typ&0xe0 and strx and not desc&0x40:
    end=d.index(0,strings+strx);name=d[strings+strx:end].decode();ordinal=desc>>8
    if 1<=ordinal<=len(libs):imports.append((libs[ordinal-1],name))
 key=p
 if key.startswith('Frameworks/'):key='@rpath/'+key.removeprefix('Frameworks/')
 images[key]={'exports':exports,'imports':imports}
missing=[];checked=0
for image,meta in images.items():
 for library,symbol in meta['imports']:
  if library in images:
   checked+=1
   if symbol not in images[library]['exports']:missing.append({'image':image,'library':library,'missingSymbol':symbol})
print({'images':len(images),'crossFrameworkImportsChecked':checked,'missingStrongImports':len(missing)})
for row in missing:print(row)
if missing:raise SystemExit(1)
