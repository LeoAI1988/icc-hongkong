/**
 * ICC官网图片批量生成脚本 v2 - 修复版
 * 使用 Evolink GPT Image 2 API
 */

const API_KEY = 'sk-ALG1yoXRHA3xqV6xthiD4CYSgsRA2xorRZwQh1QAD29UnvnO';
const BASE_URL = 'https://api.evolink.ai';
const OUTPUT_DIR = __dirname + '\\images_new';

const fs = require('fs');
const https = require('https');
const http = require('http');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const imageTasks = [
    {
        name: 'about_team_consulting',
        filename: 'about_team_consulting.jpg',
        prompt: 'Professional business consulting scene, a group of East Asian Chinese professionals (men and women, aged 30-45) in a modern luxury office with floor-to-ceiling windows showing Hong Kong city skyline. They are discussing immigration plans around a sleek conference table with documents and laptops. Warm golden hour lighting, photorealistic, high-end corporate photography style, shallow depth of field, 8K quality',
        size: '16:9', quality: '2K'
    },
    {
        name: 'about_hk_architecture',
        filename: 'about_hk_architecture.jpg',
        prompt: 'Elegant East Asian Chinese businesswoman in professional attire standing confidently in front of iconic Hong Kong architecture (Bank of China Tower or IFC), looking at camera with confident smile, golden hour warm lighting, photorealistic, premium corporate portrait style, blurred city background bokeh, 8K quality',
        size: '4:3', quality: '2K'
    },
    {
        name: 'hero_hk_skyline',
        filename: 'hero_hk_skyline.jpg',
        prompt: 'Breathtaking Hong Kong Victoria Harbor night panorama, illuminated skyscrapers reflecting on the water, Symphony of Lights show, deep blue night sky with city glow, dramatic cinematic composition, ultra-wide angle, photorealistic, National Geographic quality, vibrant neon lights in gold and blue tones',
        size: '21:9', quality: '2K'
    },
    {
        name: 'value_hk_panorama',
        filename: 'value_hk_panorama.jpg',
        prompt: 'Stunning panoramic view of Hong Kong from Victoria Peak during golden hour, modern skyscrapers mixed with traditional architecture, harbor with boats, warm golden sunlight bathing the city, lifestyle and prosperity atmosphere, photorealistic, travel magazine cover quality, ultra detailed',
        size: '16:9', quality: '2K'
    },
    {
        name: 'case_university_graduation',
        filename: 'case_university_graduation.jpg',
        prompt: 'Proud East Asian Chinese university student family at Hong Kong university graduation ceremony, young graduate in cap and gown holding diploma with joyful parents, beautiful campus background with modern university buildings, celebratory atmosphere, natural sunlight, photorealistic, emotional moment, 8K quality',
        size: '16:9', quality: '2K'
    },
    { name: 'adv_education', filename: 'adv_education.jpg', prompt: 'Bright modern classroom or library scene, East Asian Chinese students studying together with books and digital tablets, diverse age group including teenagers and parents, warm encouraging atmosphere, educational excellence theme, soft natural lighting, photorealistic, clean composition', size: '4:3', quality: '1K' },
    { name: 'adv_medical', filename: 'adv_medical.jpg', prompt: 'Premium private hospital interior in Hong Kong, East Asian patient consulting with friendly doctor in clean modern consultation room, advanced medical equipment visible, reassuring professional healthcare atmosphere, warm lighting, photorealistic, healthcare advertising quality', size: '4:3', quality: '1K' },
    { name: 'adv_travel', filename: 'adv_travel.jpg', prompt: 'East Asian Chinese couple holding passports at international airport departure gate, excited about travel, modern airport background with large windows showing airplanes on tarmac, freedom of movement concept, bright optimistic lighting, photorealistic, lifestyle photography', size: '4:3', quality: '1K' },
    { name: 'adv_property', filename: 'adv_property.jpg', prompt: 'Luxury Hong Kong apartment interior with panoramic city view through floor-to-ceiling windows, modern minimalist living room design, East Asian family enjoying their home, real estate and property investment concept, warm ambient lighting, photorealistic, interior design magazine quality', size: '4:3', quality: '1K' },
    { name: 'adv_tax', filename: 'adv_tax.jpg', prompt: 'Professional financial planning scene, East Asian Chinese accountant or consultant presenting tax optimization charts to client in modern office, digital tablet showing graphs and numbers, low tax benefit concept, clean corporate aesthetic, warm professional lighting, photorealistic', size: '4:3', quality: '1K' },
    { name: 'adv_protection', filename: 'adv_protection.jpg', prompt: 'Secure vault door or safe deposit box in prestigious bank, gold bars and important documents inside, asset protection and wealth preservation concept, elegant dark interior with spotlight lighting, feeling of safety and trust, photorealistic, premium banking aesthetic', size: '4:3', quality: '1K' }
];

function apiRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const opts = {
            hostname: url.hostname, port: 443,
            path: url.pathname, method: method,
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Parse error: ' + data.substring(0, 200))); } });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        proto.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            const file = fs.createWriteStream(filepath);
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(filepath); });
            file.on('error', reject);
        }).on('error', reject);
    });
}

async function pollTask(taskId, maxWaitMs = 180000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        const result = await apiRequest('GET', `/v1/tasks/${taskId}`);
        console.log(`    Task ${taskId.substring(taskId.length - 8)}: ${result.status} (${result.progress || '?'}%)`);
        if (result.status === 'completed') return result;
        if (result.status === 'failed') throw new Error(`Failed: ${JSON.stringify(result).substring(0, 200)}`);
        await new Promise(r => setTimeout(r, 8000));
    }
    throw new Error('Timeout');
}

async function generateOne(task, index, total) {
    console.log(`\n[${index + 1}/${total}] 🎨 ${task.name}`);
    
    // Submit
    const submit = await apiRequest('POST', '/v1/images/generations', {
        model: 'gpt-image-2',
        prompt: task.prompt,
        size: task.size,
        quality: task.quality
    });
    
    const taskId = submit.id;
    console.log(`    Submitted: ${taskId}, estimating ~${submit.task_info?.estimated_time || 60}s`);
    
    // Poll
    const done = await pollTask(taskId);
    const imgUrl = done.results?.[0] || done.result_data?.[0]?.url;
    if (!imgUrl) throw new Error('No image URL in completed task. Response: ' + JSON.stringify(done).substring(0, 300));
    
    // Download
    const outPath = OUTPUT_DIR + '\\' + task.filename;
    await downloadImage(imgUrl, outPath);
    const fsize = fs.statSync(outPath).size;
    console.log(`    ✅ ${task.filename} (${(fsize / 1024 / 1024).toFixed(2)} MB)`);
    return { ...task, taskId, url: imgUrl, fileSize: fsize };
}

async function main() {
    console.log('='.repeat(50));
    console.log('ICC Website Image Generator - GPT Image 2');
    console.log(`Tasks: ${imageTasks.length} | Output: ${OUTPUT_DIR}`);
    console.log('='.repeat(50));
    
    const ok = [], fail = [];
    for (let i = 0; i < imageTasks.length; i++) {
        try {
            const r = await generateOne(imageTasks[i], i, imageTasks.length);
            ok.push(r);
        } catch (e) {
            console.error(`    ❌ ${imageTasks[i].name}: ${e.message}`);
            fail.push({ name: imageTasks[i].name, error: e.message });
        }
        if (i < imageTasks.length - 1) {
            console.log('    ⏳ Waiting 5s...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Done: ✅ ${ok.length} success, ❌ ${fail.length} failed`);
    if (fail.length) fail.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    console.log(`Output: ${OUTPUT_DIR}`);
    console.log('='.repeat(50));
    
    fs.writeFileSync(OUTPUT_DIR + '\\_log.json', JSON.stringify({ success: ok, failures: fail, time: new Date().toISOString() }, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
