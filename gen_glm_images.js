const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_KEY = 'e1021849807749e4b1ea0cd5de5f3614.aKvak5y4A7EwpvkJ';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations';
const OUT_DIR = path.join(__dirname, 'images_glm');
const SIZE = '1472x1088'; // 4:3横向，适合卡片

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const tasks = [
  {
    name: 'adv_education',
    prompt: '一张高质量商业摄影风格照片，展现香港大学校园内，东亚面孔的学生们在现代化阶梯教室里认真学习讨论，阳光透过落地窗洒入，背景是港大标志性建筑，画面温暖明亮，色彩饱满，体现优质教育的氛围，横构图，4:3比例'
  },
  {
    name: 'adv_medical',
    prompt: '一张高质量商业摄影风格照片，展现香港现代化医院的宽敞明亮诊室，先进的医疗设备，东亚面孔的专业医生和护士正在会诊，患者面带微笑，环境整洁温馨，体现亚洲顶尖医疗保障体系，横构图，4:3比例'
  },
  {
    name: 'adv_travel',
    prompt: '一张高质量商业摄影风格照片，展现一位中国商务人士手持香港特区护照站在国际机场候机厅，背景是大型航班信息屏和登机口，光线明亮现代，体现168国免签自由出行的便捷，横构图，4:3比例'
  },
  {
    name: 'adv_property',
    prompt: '一张高质量商业摄影风格照片，展现香港维多利亚港沿岸的高端住宅楼盘全景，摩天大楼林立，海景壮阔，灯光璀璨，体现香港房产的投资价值和国际金融中心地位，横构图，4:3比例'
  },
  {
    name: 'adv_tax',
    prompt: '一张高质量商业风格插画，展现低税天堂概念，画面中心是一个天平秤，一端是厚重的税单（标注高税率），另一端是轻巧的金币（标注香港低税率），背景是香港中环金融区天际线，金色与深蓝色调，商务质感，横构图，4:3比例'
  },
  {
    name: 'adv_law',
    prompt: '一张高质量商业摄影风格照片，展现法律公正保护私有财产的主题，画面中是香港终审法院大楼古典建筑外观，庄严肃穆，旁边有法槌和法律典籍的特写，光影对比强烈，体现普通法系对私有财产的坚实保障，横构图，4:3比例'
  },
  {
    name: 'team_consultant',
    prompt: '一张专业商务肖像照，东亚面孔中年男性，穿着深蓝色西装白衬衫，气质沉稳专业，微笑自信，背景是浅灰色渐变，商务咨询顾问形象，正面半身照，适合圆形头像裁剪'
  },
  {
    name: 'team_advisor',
    prompt: '一张专业商务肖像照，东亚面孔中年女性，穿着深色职业套装，气质干练亲和，微笑温暖，背景是浅灰色渐变，专业移民顾问形象，正面半身照，适合圆形头像裁剪'
  },
  {
    name: 'team_education',
    prompt: '一张专业商务肖像照，东亚面孔年轻男性，穿着休闲商务装，戴眼镜，气质知性儒雅，微笑温和，背景是浅灰色渐变，教育规划专家形象，正面半身照，适合圆形头像裁剪'
  },
  {
    name: 'contact_office',
    prompt: '一张高质量商业摄影风格照片，展现深圳南山区现代化写字楼大堂，高挑明亮的空间，大理石地面，前台接待区，商务精英来往，光线充足，体现专业咨询公司的办公环境，横构图，4:3比例'
  }
];

async function generateOne(task) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-image',
      prompt: task.prompt,
      size: SIZE,
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
            reject(new Error(`API error for ${task.name}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error for ${task.name}: ${data.substring(0, 200)}`));
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
      stream.on('finish', () => {
        const size = fs.statSync(filepath).size;
        resolve(size);
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log(`Generating ${tasks.length} images with GLM-Image...`);
  const results = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`[${i + 1}/${tasks.length}] ${task.name} - Submitting...`);
    try {
      const result = await generateOne(task);
      console.log(`[${i + 1}/${tasks.length}] ${task.name} - Got URL, downloading...`);
      const outPath = path.join(OUT_DIR, `${task.name}.jpg`);
      const size = await downloadFile(result.url, outPath);
      console.log(`[${i + 1}/${tasks.length}] ${task.name} - OK (${(size / 1024 / 1024).toFixed(2)}MB)`);
      results.push({ name: task.name, size, path: outPath });
    } catch (e) {
      console.error(`[${i + 1}/${tasks.length}] ${task.name} - FAIL: ${e.message}`);
      results.push({ name: task.name, error: e.message });
    }
    // Rate limit: wait 2s between requests
    if (i < tasks.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n=== Results ===');
  results.forEach(r => {
    if (r.error) console.log(`FAIL: ${r.name} - ${r.error}`);
    else console.log(`OK: ${r.name} (${(r.size / 1024).toFixed(0)}KB)`);
  });
}

main().catch(console.error);
