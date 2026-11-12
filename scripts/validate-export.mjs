#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

function arg(name, fallback = undefined) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
function fail(message) { console.error(`FAIL: ${message}`); process.exitCode = 1; }
const file = process.argv[2], expected = Number(arg('--duration', '0')), tolerance = Number(arg('--tolerance', '.04'));
if (!file) { console.error('Usage: node scripts/validate-export.mjs <file> [--duration seconds] [--tolerance seconds]'); process.exit(2); }
try {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'format=duration,format_name:stream=index,codec_type,codec_name,duration,start_time,avg_frame_rate', file]);
  const info = JSON.parse(stdout), streams = info.streams || [], video = streams.find((s) => s.codec_type === 'video'), audio = streams.find((s) => s.codec_type === 'audio');
  if (!video) fail('missing video stream');
  if (!audio) fail('missing audio stream');
  const streamDuration = (stream) => Number.isFinite(Number(stream?.duration)) ? Number(stream.duration) : null;
  const vd = streamDuration(video), ad = streamDuration(audio);
  const fd = Number(info.format?.duration || Math.max(vd || 0, ad || 0));
  if (expected > 0 && Math.abs(fd - expected) > Math.max(tolerance, expected * .02)) fail(`duration ${fd.toFixed(3)}s differs from expected ${expected.toFixed(3)}s`);
  const avDrift = vd !== null && ad !== null ? Math.abs(vd - ad) : null;
  if (avDrift !== null && avDrift > tolerance) fail(`A/V duration drift ${avDrift.toFixed(3)}s exceeds ${tolerance.toFixed(3)}s`);
  if (video && Number(video.start_time || 0) < -tolerance) fail(`video starts before zero: ${video.start_time}`);
  if (audio && Number(audio.start_time || 0) < -tolerance) fail(`audio starts before zero: ${audio.start_time}`);
  if (video && !/^\d+\/\d+$/.test(video.avg_frame_rate || '')) fail('missing video frame rate');
  const report = {
    ok: !process.exitCode,
    file,
    duration: fd,
    format: info.format?.format_name || null,
    video: video && { codec: video.codec_name, duration: vd, fps: video.avg_frame_rate },
    audio: audio && { codec: audio.codec_name, duration: ad },
    avDrift,
    avDriftCheck: avDrift === null ? 'unavailable in stream metadata' : 'measured',
  };
  console.log(JSON.stringify(report, null, 2));
} catch (error) { fail(error.stderr || error.message); }
