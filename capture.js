const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,10800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating...');
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait a bit more for animations/fonts
  await new Promise(r => setTimeout(r, 3000));

  // Full page screenshot
  const fullPath = path.join(__dirname, 'screenshot_full.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log('Full screenshot saved:', fullPath, 'Size:', (fs.statSync(fullPath).size / 1024).toFixed(1) + ' KB');

  // Hero section only
  const heroPath = path.join(__dirname, 'screenshot_hero.png');
  await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('Hero screenshot saved:', heroPath, 'Size:', (fs.statSync(heroPath).size / 1024).toFixed(1) + ' KB');

  // Scroll down and take education section
  await page.evaluate(() => {
    const edu = document.getElementById('education');
    if (edu) edu.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  const eduPath = path.join(__dirname, 'screenshot_education.png');
  await page.screenshot({ path: eduPath });
  console.log('Education screenshot saved:', eduPath, 'Size:', (fs.statSync(eduPath).size / 1024).toFixed(1) + ' KB');

  await browser.close();
  process.exit(0);
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
