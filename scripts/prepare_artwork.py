"""Encode production copies of original event artwork; originals are retained."""
from pathlib import Path
from PIL import Image
import subprocess,json

root=Path(__file__).resolve().parents[1]
catalog=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {COVER_THEMES} from './src/art-catalog.mjs'; console.log(JSON.stringify(COVER_THEMES));"],cwd=root,text=True))
records=[]
for filename in sorted({item['file'] for item in catalog.values()}):
    target=root/filename;source=target.with_suffix('.png')
    if target.suffix!='.jpg':raise ValueError('Production artwork should use JPEG copies')
    if not source.exists():raise FileNotFoundError(source)
    with Image.open(source) as original:
        image=original.convert('RGB');image.thumbnail((1536,1024),Image.Resampling.LANCZOS)
        image.save(target,'JPEG',quality=90,subsampling=0,optimize=True,progressive=True)
    records.append({'file':filename,'sourceBytes':source.stat().st_size,'productionBytes':target.stat().st_size})
report={'themes':len(catalog),'uniqueIllustrations':len(records),'sourceBytes':sum(r['sourceBytes'] for r in records),'productionBytes':sum(r['productionBytes'] for r in records),'files':records}
(root/'assets/events/optimization-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
