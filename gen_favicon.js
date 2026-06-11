const fs = require('fs');
const zlib = require('zlib');

const size = 32;

function createPixelData() {
  const data = [];
  const grid = [
    '############################',
    '#..........................#',
    '#.GGGGGGGG........GGGGGGG.#',
    '#.G......G........G.....G.#',
    '#.G......G........G.....G.#',
    '#.G...GGGGG........G.....G.#',
    '#.G....G..........GGGGGGG.#',
    '#.G....G..................#',
    '#.G....G..................#',
    '#.GGGGGG.................#',
    '#........................#',
    '#..GGGGGGGGGGGGGGGGGGGG..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..G...................G..#',
    '#..GGGGGGGGGGGGGGGGGGGG..#',
    '#........................#',
    '#..CCCCCCCCC.......CCC...#',
    '#..C.......C.......C.C...#',
    '#..C.......C.......C.C...#',
    '#..C.......C.......C.C...#',
    '#..C.......C.......C.C...#',
    '#..CCCCCCCCC.......CCC...#',
    '#........................#',
    '#........................#',
    '############################',
  ];
  
  for (let y = 0; y < size; y++) {
    data.push(0);
    const row = grid[y] || '';
    for (let x = 0; x < size; x++) {
      const ch = row[x] || '.';
      if (ch === '#') {
        data.push(201, 169, 110, 255);
      } else if (ch === 'G' || ch === 'C') {
        data.push(201, 169, 110, 255);
      } else {
        data.push(10, 10, 10, 255);
      }
    }
  }
  return Buffer.from(data);
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function crc32(buf) {
  let c = 0xffffffff;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = (v & 1) ? (0xedb88320 ^ (v >>> 1)) : (v >>> 1);
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(size, 0);
ihdrData.writeUInt32BE(size, 4);
ihdrData[8] = 8;
ihdrData[9] = 6;
ihdrData[10] = 0;
ihdrData[11] = 0;
ihdrData[12] = 0;

const ihdr = pngChunk('IHDR', ihdrData);
const raw = createPixelData();
const compressed = zlib.deflateSync(raw);
const idat = pngChunk('IDAT', compressed);
const iend = pngChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([sig, ihdr, idat, iend]);
const outPath = __dirname + '\\favicon.png';
fs.writeFileSync(outPath, png);
console.log('ICC Favicon created:', png.length, 'bytes ->', outPath);
