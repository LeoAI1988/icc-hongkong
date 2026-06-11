const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Find Chrome
const chromePaths = [
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
];

let chromePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    chromePath = p;
    console.log('Found browser:', p);
    break;
  }
}

if (!chromePath) {
  console.error('No Chrome/Edge found');
  process.exit(1);
}

const { execSync, spawn } = require('child_process');

// Kill existing instances on our port
try { execSync('netstat -ano | findstr :9222 | findstr LISTENING', { encoding: 'utf8' }).split('\n').forEach(line => { const m = line.trim().split(/\s+/); if (m.length > 4) try { process.kill(parseInt(m[m.length-1])); } catch(e) {} }); } catch(e) {}

// Launch Chrome with remote debugging
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--remote-debugging-port=9222',
  '--window-size=1920,10800',
  '--force-device-scale-factor=1',
], { stdio: ['pipe', 'pipe', 'pipe'] });

setTimeout(async () => {
  try {
    // Get debugging info
    const debugInfo = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json/version', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const wsUrl = debugInfo.webSocketDebuggerUrl;
    console.log('WebSocket URL:', wsUrl);

    // Use simple HTTP-based CDP protocol
    // First create a new target
    const target = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json/new?http://127.0.0.1:8090/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log('Target created:', target.id);

    // Wait for page to load
    await new Promise(r => setTimeout(r, 5000));

    // We need WebSocket for CDP commands, use a simpler approach
    // Use the /json/protocol endpoint doesn't help, we need actual WS
    
    // Let's use a different approach - use Chrome's built-in screenshot via headless
    const screenshotPath = path.join(__dirname, 'screenshot.png');
    
    // Kill chrome and re-launch with screenshot flag
    chrome.kill();
    await new Promise(r => setTimeout(r, 1000));
    
    // Use --screenshot approach
    const chrome2 = spawn(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--screenshot=' + screenshotPath,
      '--window-size=1920,10800',
      '--force-device-scale-factor=1',
      '--default-background-color=0',
      'http://127.0.0.1:8090/',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    chrome2.stderr.on('data', d => process.stderr.write(d));
    
    // Wait for screenshot
    await new Promise(r => setTimeout(r, 8000));
    
    if (fs.existsSync(screenshotPath)) {
      const stats = fs.statSync(screenshotPath);
      console.log('Screenshot saved:', screenshotPath, 'Size:', (stats.size / 1024).toFixed(1) + ' KB');
    } else {
      console.log('Screenshot not found, trying alternative method...');
    }

    chrome2.kill();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
