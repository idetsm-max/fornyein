// Record the main voice straight from the microphone (left side, "အသံ" tab).
// The recording is handed to the app exactly like a chosen file (same #file input), so waveform, Tap-sync, cutting,
// effects and export all work on it. Browser asks for microphone permission the first time.
const FN = window.FN, $ = (id) => document.getElementById(id);
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }

const pane = document.querySelector('.side .pane') || document.body;
const card = mk('div', { className: 'card' }); pane.append(card);
card.append(mk('b', { textContent: 'မိုက်နဲ့ တိုက်ရိုက် အသံသွင်းမယ်' }));
card.append(mk('div', { className: 'mut', style: 'margin:4px 0 8px;line-height:1.7;font-size:13px', textContent: 'နားကြပ်တပ်ပြီး သွင်းရင် ပိုကောင်းပါတယ် (အသံပဲ့တင်မထွက်အောင်)။ သွင်းပြီးတာနဲ့ အသံဖိုင်အဖြစ် အလိုအလျောက် ထည့်ပေးပါမယ်၊ အရင်ရွေးထားတဲ့ ကဗျာဖတ်သံကို အစားထိုးပါမယ်။' }));

const dev = mk('select'); dev.style.maxWidth = '100%';
const cb = (label, checked) => { const i = mk('input', { type: 'checkbox', checked }); return [i, mk('label', { className: 'mut' }, [i, ' ' + label])]; };
const [ns, nsL] = cb('Noise suppression', false), [ec, ecL] = cb('Echo cancel', false), [ag, agL] = cb('Auto gain', false), [cd, cdL] = cb('၃ စက္ကန့် ရေတွက်ပြီးမှ စ', true);
const btn = mk('button', { className: 'pri', textContent: '● အသံသွင်းမယ်' });
const stopBtn = mk('button', { textContent: '■ ရပ်', disabled: true });
const timer = mk('span', { className: 'mut', textContent: '0:00' });
const meter = mk('canvas', { width: 280, height: 12 }); meter.style.cssText = 'width:100%;height:12px;border-radius:4px';
card.append(mk('div', { className: 'row' }, [mk('label', { className: 'mut' }, ['Microphone ', dev]), mk('button', { textContent: '↻', title: 'device စာရင်း ပြန်ယူ', onclick: () => listDevices() })]),
  mk('div', { className: 'row' }, [nsL, ecL, agL]), mk('div', { className: 'row' }, [cdL]),
  mk('div', { className: 'row' }, [btn, stopBtn, timer]), mk('div', { className: 'row' }, [meter]));

async function listDevices() {
  try {
    const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput'), cur = dev.value;
    dev.textContent = ''; dev.add(new Option('Default', ''));
    ds.forEach((d, i) => dev.add(new Option(d.label || `Microphone ${i + 1}`, d.deviceId))); dev.value = cur;
  } catch { /* no permission yet */ }
}
listDevices();

let stream = null, rec = null, chunks = [], t0 = 0, tmr = 0, actx = null, an = null, raf = 0, cdTimer = 0, recording = false;
const g = meter.getContext('2d');
function drawMeter() {
  g.fillStyle = '#0e121a'; g.fillRect(0, 0, meter.width, meter.height);
  if (an) {
    const b = new Float32Array(an.fftSize); an.getFloatTimeDomainData(b); let pk = 0; for (const x of b) pk = Math.max(pk, Math.abs(x));
    g.fillStyle = pk > 0.98 ? '#ff4d5e' : pk > 0.7 ? '#f5b83d' : '#3ddc84'; g.fillRect(0, 0, Math.min(1, pk) * meter.width, meter.height);
  }
  if (recording || an) raf = requestAnimationFrame(drawMeter);
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function cleanup() {
  recording = false; clearInterval(tmr); clearTimeout(cdTimer); cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null;
  if (actx) actx.close().catch(() => {}); actx = an = null; drawMeter();
  btn.disabled = false; btn.textContent = '● အသံသွင်းမယ်'; stopBtn.disabled = true;
}
async function begin() {
  btn.disabled = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: dev.value ? { exact: dev.value } : undefined, echoCancellation: ec.checked, noiseSuppression: ns.checked, autoGainControl: ag.checked, channelCount: 1 } });
  } catch (e) { FN.setStatus('မိုက်ခရိုဖုန်း ဖွင့်မရပါ: ' + e.message + ' (browser ရဲ့ ခွင့်ပြုချက်ကို စစ်ပါ)'); cleanup(); return; }
  listDevices();
  actx = new AudioContext(); const srcN = actx.createMediaStreamSource(stream); an = actx.createAnalyser(); an.fftSize = 1024; srcN.connect(an); drawMeter();
  const start = () => {
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 192000 } : undefined); chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = finish; rec.start(250); recording = true; t0 = Date.now(); stopBtn.disabled = false; btn.textContent = '● သွင်းနေပါတယ်...';
    tmr = setInterval(() => { timer.textContent = fmt((Date.now() - t0) / 1000); }, 200); FN.setStatus('အသံသွင်းနေပါတယ်... (■ ရပ် နှိပ်ရင် ပြီးမယ်)');
  };
  if (cd.checked) { let n = 3; const tick = () => { if (!stream) return; if (n === 0) { start(); return; } btn.textContent = `စမယ် ${n}...`; n--; cdTimer = setTimeout(tick, 1000); }; tick(); } else start();
}
async function finish() {
  const type = (rec && rec.mimeType) || 'audio/webm', blob = new Blob(chunks, { type }); cleanup();
  if (blob.size < 2000) { FN.setStatus('အသံ မပါလာပါ — မိုက်ကို စစ်ပါ'); return; }
  const ext = type.includes('mp4') ? 'm4a' : 'webm', stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const file = new File([blob], `recording-${stamp}.${ext}`, { type });
  const dt = new DataTransfer(); dt.items.add(file); const inp = $('file'); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  timer.textContent = '0:00';
}
btn.onclick = begin;
stopBtn.onclick = () => { if (rec && rec.state !== 'inactive') rec.stop(); };
