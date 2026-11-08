// Fonts: a few common Myanmar fonts + every font file in the private R2 bucket folder Fonts/ (+ a file picked from the user's computer).
const FONT_RE = /\.(ttf|otf|woff2?)$/i;
export const baseFonts = ['Noto Sans Myanmar', 'Noto Serif Myanmar', 'Padauk', 'Pyidaungsu', 'sans-serif'];
export async function loadR2Fonts() {
  let items = []; try { const r = await fetch('/api/library/Fonts', { cache: 'no-store' }); if (r.ok) items = await r.json(); } catch { /* offline / no R2 */ }
  const fams = [];
  for (const it of items) {
    if (!FONT_RE.test(it.name)) continue;
    const fam = it.name.replace(/\.[^.]+$/, '');
    try { const ff = new FontFace(fam, `url(/api/asset/Fonts/${it.name.split('/').map(encodeURIComponent).join('/')})`); await ff.load(); document.fonts.add(ff); fams.push(fam); } catch { /* skip a broken file */ }
  }
  return fams;
}
export async function addLocalFont(file) {
  const fam = file.name.replace(/\.[^.]+$/, ''), ff = new FontFace(fam, await file.arrayBuffer()); await ff.load(); document.fonts.add(ff); return fam;
}
