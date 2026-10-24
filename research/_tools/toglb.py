import json,base64,struct,sys
src,dst=sys.argv[1],sys.argv[2]
j=json.load(open(src))
buf=bytearray(base64.b64decode(j['buffers'][0]['uri'].split(',',1)[1]))
for im in j.get('images',[]):
    if 'uri' in im and im['uri'].startswith('data:'):
        mime=im['uri'][5:].split(';')[0];data=base64.b64decode(im['uri'].split(',',1)[1])
        while len(buf)%4:buf.append(0)
        j['bufferViews'].append({'buffer':0,'byteOffset':len(buf),'byteLength':len(data)});buf+=data
        del im['uri'];im['bufferView']=len(j['bufferViews'])-1;im['mimeType']=mime
while len(buf)%4:buf.append(0)
j['buffers'][0]={'byteLength':len(buf)}
js=json.dumps(j,separators=(',',':')).encode()
while len(js)%4:js+=b' '
glb=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(buf))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(buf),b'BIN\0')+bytes(buf)
open(dst,'w').write('window.MODEL_B64="'+base64.b64encode(glb).decode()+'";')
print(dst,len(glb))
