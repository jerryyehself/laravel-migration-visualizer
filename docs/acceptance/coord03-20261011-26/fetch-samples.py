import json, hashlib, urllib.request, concurrent.futures
from pathlib import Path
root=Path('/workspace/scratch/a9e600a95185/coord03-review')
samples=json.loads((root/'docs/research/r1-samples.json').read_text())
def fetch(item):
    sample,file=item
    url=f"https://raw.githubusercontent.com/{sample['repo']}/{sample['commit']}/{file['path']}"
    data=urllib.request.urlopen(url,timeout=30).read()
    actual=hashlib.sha256(data).hexdigest()
    if actual != file['sha256']: raise ValueError(f"hash mismatch: {url}")
    dest=root/'artifacts/research-inputs'/sample['id']/file['path']
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    return {'sample':sample['id'],'url':url,'expected':file['sha256'],'actual':actual,'match':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(fetch,[(s,f) for s in samples for f in s['files']]))
(root/'artifacts/coord03-source-hashes.json').write_text(json.dumps(results,indent=2)+'\n')
print(f'{len(results)} hashes MATCH')
