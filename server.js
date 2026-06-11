const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\高翔\\.qclaw\\workspace-agent-c5893108\\icc_website_v2';
const mime = {'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let fp = path.join(dir, req.url==='/'?'index.html':req.url);
  fs.readFile(fp,(e,d)=>{
    if(e){res.writeHead(404);res.end('Not found');}
    else{res.writeHead(200,{'Content-Type':mime[path.extname(fp)]||'application/octet-stream'});res.end(d);}
  });
}).listen(8893,()=>console.log('OK 8893'));