from pathlib import Path
from PIL import Image,ImageChops
import json
out=Path(__file__).resolve().parent;results=[]
for width in (375,768,1280,1440):
 a=Image.open(out/f'baseline-v1-{width}.png').convert('RGB');b=Image.open(out/f'candidate-v1-{width}.png').convert('RGB')
 if a.size!=b.size:results.append({'width':width,'baselineSize':a.size,'candidateSize':b.size,'changedPixels':'SIZE MISMATCH'});continue
 diff=ImageChops.difference(a,b);count=sum(p!=(0,0,0) for p in diff.get_flattened_data());results.append({'width':width,'size':a.size,'changedPixels':count})
print(results);(out/'v1-parity.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8');assert all(x['changedPixels']==0 for x in results)
