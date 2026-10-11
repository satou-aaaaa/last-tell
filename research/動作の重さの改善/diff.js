// 試作：描き直しで中身が同じなら、DOM を作り直さない
document.addEventListener('DOMContentLoaded',()=>{const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 const inst=el=>{if(!el||el.__dh)return;el.__dh=1;Object.defineProperty(el,'innerHTML',{configurable:true,set(v){if(el.__h===v&&el.childNodes.length)return;el.__h=v;d.set.call(el,v)},get(){return d.get.call(el)}})};
 const r0=render;render=function(...a){try{inst($('mine'));for(let i=1;i<10;i++){inst($('spot'+i));inst($('plate'+i))}}catch(e){}return r0.apply(this,a)}});
