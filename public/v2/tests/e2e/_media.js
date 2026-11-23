// Shared test fixture: a short 8 kHz mono WAV tone.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function wavFile(seconds = 0.6, rate = 8000) {
  const samples = Math.floor(rate * seconds);
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) buf.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 220) * 6000), 44 + i * 2);
  const file = path.join(os.tmpdir(), `fornyein-tone-${seconds}.wav`);
  fs.writeFileSync(file, buf);
  return file;
}

module.exports = { wavFile };
