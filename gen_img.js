const https = require('https');
const fs = require('fs');
const http = require('http');

const API_KEY = 'sk-ALG1yoXRHA3xqV6xthiD4CYSgsRA2xorRZwQh1QAD29UnvnO';
const OUT_DIR = __dirname + '\\images_new';

// Remaining ~8.3 credits, need to be strategic
// high=~7credits, medium=~2-3, low=~0.5-1
// Already done: about_team_consulting.jpg, hero_hk_skyline.jpg
const TASKS = [
    ['about_arch', 'about_hk_architecture.jpg',
     'Elegant East Asian Chinese businesswoman in professional attire standing in front of Hong Kong Bank of China Tower, confident smile, golden hour lighting, photorealistic, premium corporate portrait',
     '4:3','medium'],
    ['value', 'value_hk_panorama.jpg',
     'Stunning panoramic view of Hong Kong from Victoria Peak golden hour, modern skyscrapers and harbor with boats, warm sunlight, lifestyle prosperity atmosphere, photorealistic',
     '16:9','medium'],
    ['case', 'case_university_graduation.jpg',
     'Proud East Asian Chinese graduate in cap and gown holding diploma with joyful parents at Hong Kong university graduation ceremony, beautiful campus, celebratory natural sunlight, photorealistic',
     '16:9','medium'],
    ['edu', 'adv_education.jpg',
     'Bright modern classroom, East Asian Chinese students studying together with books and tablets, warm encouraging educational atmosphere, soft lighting, photorealistic',
     '4:3','low'],
    ['med', 'adv_medical.jpg',
     'Premium private hospital interior Hong Kong, East Asian patient consulting friendly doctor in clean modern room, reassuring healthcare atmosphere, warm lighting, photorealistic',
     '4:3','low'],
    ['travel', 'adv_travel.jpg',
     'East Asian Chinese couple holding passports at international airport gate excited about travel, modern airport with airplanes visible, freedom concept, bright optimistic, photorealistic',
     '4:3','low'],
    ['prop', 'adv_property.jpg',
     'Luxury Hong Kong apartment interior panoramic city view floor-to-ceiling windows, modern minimalist living room, East Asian family enjoying home, warm ambient light, photorealistic',
     '4:3','low'],
    ['tax', 'adv_tax.jpg',
     'Professional financial planning scene, East Asian consultant presenting tax charts to client in modern office, tablet showing graphs, low tax benefit, warm professional, photorealistic',
     '4:3','low'],
    ['protect', 'adv_protection.jpg',
     'Secure vault door in prestigious bank, gold bars and documents inside, asset protection wealth preservation concept, elegant dark interior spotlight, safety trust, photorealistic',
     '4:3','low'],
];

function postJSON(path, data) {
    return new Promise((res, rej) => {
        const bs = JSON.stringify(data);
        const u = new URL('https://api.evolink.ai' + path);
        const req = https.request({hostname:u.hostname,port:443,path:u.pathname,method:'POST',headers:{'Authorization':'Bearer '+API_KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(bs)}}, r => {let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})});
        req.on('error',rej); req.write(bs); req.end();
    });
}

function getJSON(path) {
    return new Promise((res, rej) => {
        const u = new URL('https://api.evolink.ai' + path);
        https.get({hostname:u.hostname,port:443,path:u.pathname,headers:{'Authorization':'Bearer '+API_KEY}}, r => {let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej);
    });
}

function dl(url, dest) {
    return new Promise((res, rej) => {
        const m = url.startsWith('https')?https:http;
        m.get(url, r => {
            if (r.statusCode>=300&&r.statusCode<400&&r.headers.location) { dl(r.headers.location,dest).then(res).catch(rej); return; }
            const f = fs.createWriteStream(dest); r.pipe(f); f.on('finish',()=>{f.close();res(dest)}); f.on('error',rej);
        }).on('error',rej);
    });
}

async function poll(tid) {
    for (let i=0;i<30;i++) {
        await new Promise(r=>setTimeout(r,8000));
        const r = await getJSON('/v1/tasks/'+tid);
        process.stdout.write(`\r    [${r.progress||'?'}%] ${r.status}   `);
        if (r.status==='completed') return r;
        if (r.status==='failed') throw new Error(JSON.stringify(r).substring(0,200));
    }
    throw new Error('timeout');
}

async function run() {
    console.log('=== ICC Image Gen v3 (budget mode) ===');
    console.log('Tasks: ' + TASKS.length);
    let ok=0,fail=0;
    for (let i=0; i<TASKS.length; i++) {
        const [name,file,prompt,sz,q] = TASKS[i];
        process.stdout.write(`\n[${i+1}/${TASKS.length}] ${name} (q=${q})\n    Submit...`);
        try {
            const sub = await postJSON('/v1/images/generations',{model:'gpt-image-2',prompt,prompt,size:sz,quality:q});
            if (sub.error) throw new Error(sub.error.message || JSON.stringify(sub.error));
            if (!sub.id) throw new Error('No ID. Keys: '+Object.keys(sub).join(','));
            process.stdout.write(` ID:${sub.id.slice(-6)} Poll...`);
            const done = await poll(sub.id);
            const url = (done.results&&done.results[0])||(done.result_data&&done.result_data[0]&&done.result_data[0].url);
            if (!url) throw new Error('No URL');
            await dl(url, OUT_DIR+'\\'+file);
            const sz2 = fs.statSync(OUT_DIR+'\\'+file).size;
            console.log(`\n    OK ${file} (${(sz2/1024/1024).toFixed(2)}MB)`);
            ok++;
        } catch(e) {
            console.log(`\n    FAIL: ${e.message}`);
            fail++;
        }
        if (i<TASKS.length-1) await new Promise(r=>setTimeout(r,3000));
    }
    console.log('\n=== DONE: '+ok+' OK, '+fail+' fail ===');
    fs.writeFileSync(OUT_DIR+'\\_log.json', JSON.stringify({ok,fail,time:new Date().toISOString()},null,2));
}
run().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
