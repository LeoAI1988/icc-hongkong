const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Full page
  await page.goto('http://localhost:8893', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'C:\\Users\\高翔\\.qclaw\\workspace-agent-c5893108\\icc_website_v2\\screenshot_full.png', fullPage: true });
  console.log('Full page screenshot done');

  // Hero
  const hero = await page.$('#hero');
  if (hero) {
    await hero.screenshot({ path: 'C:\\Users\\高翔\\.qclaw\\workspace-agent-c5893108\\icc_website_v2\\screenshot_hero.png' });
    console.log('Hero screenshot done');
  } else {
    console.log('Hero not found');
  }

  // Values section
  const values = await page.$('#values');
  if (values) {
    await values.screenshot({ path: 'C:\\Users\\高翔\\.qclaw\\workspace-agent-c5893108\\icc_website_v2\\screenshot_values.png' });
    console.log('Values screenshot done');
  }

  // Team section
  const team = await page.$('#team');
  if (team) {
    await team.screenshot({ path: 'C:\\Users\\高翔\\.qclaw\\workspace-agent-c5893108\\icc_website_v2\\screenshot_team.png' });
    console.log('Team screenshot done');
  }

  await browser.close();
  console.log('All screenshots complete');
})();
