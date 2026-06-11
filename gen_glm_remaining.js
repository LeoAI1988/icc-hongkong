const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_KEY = 'e1021849807749e4b1ea0cd5de5f3614.aKvak5y4A7EwpvkJ';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations';
const OUT_DIR = path.join(__dirname, 'images_glm');

const tasks = [
  {
    name: 'team_advisor',
    prompt: '一张专业商务肖像照，东亚面孔中年女性，穿着深色职业套装，气质干练亲和，微笑温暖，背景是浅灰色渐变，专业移民顾问形象，正面半身照，适合圆形头像裁剪',
    size: '1280x1280'
  },
  {
    name: 'team_education',
    prompt: '一张专业商务肖像照，东亚面孔年轻男性，穿着休闲商务装，戴眼镜，气质知性儒雅，微笑温和，背景是浅灰色渐变，教育规划专家形象，正面半身照，适合圆形头像裁剪',
    size: '1280x1280'
  },
  {
    name: 'contact_office',
    prompt: '一张高质量商业摄影风格照片，展现深圳南山区现代化写字楼大堂，高挑明亮的空间，大理石地面，前台接待区，商务精英来往，光线充足，体现专业咨询公司的办公环境，横构图，4:3比例',
    size: '1472x1088'
  }
];

async function generateOne(task) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-image',
      prompt: task.prompt,
      size: task.size,
      quality: 'hd'
    });

    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data[0] && json.data[0].url) {
            resolve({ task, url: json.data[0].url });
          } else {
            reject(new Error(`API error: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => resolve(fs.statSync(filepath).size));
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`[${i+1}/${tasks.length}] ${task.name} - Generating...`);
    try {
      const result = await generateOne(task);
      const outPath = path.join(OUT_DIR, `${task.name}.jpg`);
      const size = await downloadFile(result.url, outPath);
      console.log(`[${i+1}/${tasks.length}] ${task.name} - OK (${(size/1024).toFixed(0)}KB)`);
    } catch (e) {
      console.error(`[${i+1}/${tasks.length}] ${task.name} - FAIL: ${e.message}`);
    }
    if (i < tasks.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  console.log('Done!');
}

main().catch(console.error);
