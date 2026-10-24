# 頭の肌に「髪の下塗り」の濃さを塗って、前・横・後ろ・上から見る（ディーラーの髪の範囲を決めるため）
import sys, os, struct, numpy as np
from PIL import Image, ImageDraw
def rd(p):
    b=open(p,'rb').read(); m,nv,ni,sk=struct.unpack('<4sIII',b[:16]); o=16
    P=np.frombuffer(b[o:o+nv*12],'<f4').reshape(-1,3); o+=nv*24; U=np.frombuffer(b[o:o+nv*8],'<f4').reshape(-1,2); o+=nv*8; I=np.frombuffer(b[o:o+ni*4],'<i4'); return P,U,I
d=np.load('/home/claude/dealerwork/an/Dealer_head.npz', allow_pickle=True); C=d['P']; T=d['T']
def cov_from_bin(path):
    P,U,I=rd(path)
    from scipy.spatial import cKDTree
    _,m=cKDTree(P).query(C); dd,_=cKDTree(P).query(C)
    c=np.where(dd<0.0015, U[m,0], 0.0); return c
def draw(cov, out, cards=None):
    S=900; img=Image.new('RGB',(S*2,S*2),(40,40,60)); dr=ImageDraw.Draw(img)
    views=[(lambda p:(p[0],p[1]), lambda p:p[2], (0,0)), (lambda p:(-p[2],p[1]), lambda p:p[0], (S,0)), (lambda p:(-p[0],p[1]), lambda p:-p[2], (0,S)), (lambda p:(p[0],-p[2]), lambda p:p[1], (S,S))]
    n=np.cross(C[T[:,1]]-C[T[:,0]],C[T[:,2]]-C[T[:,0]]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    for proj,depth,(ox,oy) in views:
        dep=np.array([depth(C[t].mean(0)) for t in T])
        order=np.argsort(dep)
        for ti in order:
            t=T[ti]; pts=[proj(C[i]) for i in t]
            if (pts[1][0]-pts[0][0])*(pts[2][1]-pts[0][1])-(pts[1][1]-pts[0][1])*(pts[2][0]-pts[0][0]) > 0 and False: continue
            c=cov[t].mean(); a=min(1,c**0.5*0.95)
            sh=0.55+0.45*abs(n[ti,2] if ox==0 and oy==0 else n[ti,0])
            base=np.array([225,190,165])*sh; col=tuple(int(v*(1-a)+12*a) for v in base)
            q=[(ox+S/2+x*2600, oy+S/2-(y-1.60)*2600) if not (ox==S and oy==S) else (ox+S/2+x*2600, oy+S/2+y*2600) for x,y in pts]
            dr.polygon(q,fill=col)
    img.save(out)
if __name__=='__main__':
    cov=cov_from_bin(sys.argv[1]); draw(cov, sys.argv[2])
