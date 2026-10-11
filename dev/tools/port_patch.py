#!/usr/bin/env python3
"""旧式パッチ（html→html）を、レーンのファイルを残したまま src の写しへ当てる。
   python3 port.py SRC_STRUCT OUTDIR patch1.py [patch2.py ...]
   OUTDIR に当てた後の構造そのままの src を作り、組み立て結果がパッチの出力と1文字も違わないか確かめる。"""
import sys,os,subprocess,shutil,tempfile,json
T='/mnt/project-files/dev/tools'
src,out,patches=sys.argv[1],sys.argv[2],sys.argv[3:]
tmp=tempfile.mkdtemp();run=lambda *c,**k:subprocess.run(c,check=True,**k)
a=os.path.join(tmp,'a.html');run(sys.executable,T+'/build.py',src,a,stdout=subprocess.DEVNULL)
cur=a
for i,p in enumerate(patches):
    nx=os.path.join(tmp,f'p{i}.html');run(sys.executable,os.path.abspath(p),cur,nx,stdout=subprocess.DEVNULL);cur=nx
fa,fb=os.path.join(tmp,'fa'),os.path.join(tmp,'fb')
run(sys.executable,T+'/split.py',a,fa,stdout=subprocess.DEVNULL);run(sys.executable,T+'/split.py',cur,fb,stdout=subprocess.DEVNULL)
if os.path.exists(out):shutil.rmtree(out)
shutil.copytree(src,out)
order=json.load(open(os.path.join(src,'order.json')))
std=json.load(open(os.path.join(fa,'order.json')))
lanes=[f for f in order if f not in std]
def rd(p):return open(p,encoding='utf-8').read()
for f in std:
    A,B=rd(os.path.join(fa,f)),rd(os.path.join(fb,f))
    if A==B:continue
    so=rd(os.path.join(src,f))
    if A.startswith(so):
        tail=A[len(so):]
        if B.endswith(tail):
            open(os.path.join(out,f),'w',encoding='utf-8').write(B[:len(B)-len(tail)] if tail else B);print('changed',f,'(prefix)');continue
    import difflib
    members=[m for m in order if m==f or (m in lanes and rd(os.path.join(src,m)) and rd(os.path.join(src,m)) in A)]
    # A を members の順に並べた行に分け、各行がどの member のものかを持つ
    owner=[];pos=0;parts=[rd(os.path.join(src,m)) for m in members]
    al=A.splitlines(True);bl=B.splitlines(True)
    # member の境目（行番号）
    bounds=[];acc=0
    for m,t in zip(members,parts):
        k=A.find(t,acc)
        if k<0:sys.exit('並びが分からない: '+f)
        bounds.append((A[:k].count('\n'),A[:k+len(t)].count('\n'),m));acc=k+len(t)
    res={m:list(rd(os.path.join(src,m)).splitlines(True)) for m in members}
    edits=[]
    for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,al,bl,autojunk=False).get_opcodes():
        if tag=='equal':continue
        hit=[b for b in bounds if b[0]<=i1<b[1] or (i1==i2 and b[0]<i1<=b[1])] or [b for b in bounds if b[0]<=i1<=b[1]]
        b=hit[0]
        if i2>b[1]:sys.exit('member をまたぐ変更: '+f)
        edits.append((b,i1-b[0],i2-b[0],bl[j1:j2]))
    for b,x1,x2,new in reversed(edits):res[b[2]][x1:x2]=new
    for m in members:open(os.path.join(out,m),'w',encoding='utf-8').write(''.join(res[m]))
    print('changed',f,'->',members)
c=os.path.join(tmp,'c.html')
r=subprocess.run([sys.executable,T+'/build.py',out,c,cur])
if r.returncode:sys.exit('組み立てが合わない: '+tmp)
print('ok',out)
