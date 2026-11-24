// Live bus levels for the mixer UI. Playback registers the running mixer here
// and the dialog polls readMeters() on each animation frame.
let source = null;

export const setMeterSource = (mixer) => { source = mixer; };
export const meterSource = () => source;

export function readMeters() {
  const levels = {};
  for (const [id, bus] of source?.buses || []) {
    const analyser = bus?.analyser;
    if (!analyser?.getFloatTimeDomainData) continue;
    const buf = new Float32Array(analyser.fftSize || 256);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    levels[id] = Math.min(1, Math.sqrt(sum / buf.length) * 3);
  }
  return levels;
}
