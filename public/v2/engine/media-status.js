// Missing-media detection and relinking (M6). Pure helpers so both the panel
// and the tests can reason about a project without touching IndexedDB.

export function missingMediaIds(project, availableIds) {
  const have = availableIds instanceof Set ? availableIds : new Set(availableIds || []);
  return Object.keys(project?.media || {}).filter((id) => !have.has(id));
}

export function relinkMedia(project, mediaId, meta = {}) {
  const entry = { ...(project.media?.[mediaId] || {}), ...meta };
  project.media = { ...(project.media || {}), [mediaId]: entry };
  for (const track of project.tracks || []) {
    for (const clip of track.clips || []) {
      if (clip.src?.mediaId === mediaId) clip.src = { ...clip.src, mediaId };
    }
  }
  return entry;
}

const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
export const myNumber = (n) => String(n).replace(/\d/g, (d) => MY_DIGITS[+d]);

export const relinkLabel = (count, T) => (count === 1
  ? T('1 file is missing — relink it', 'ဖိုင် ၁ ခု ပျောက်နေသည် — ပြန်ချိတ်ပါ')
  : T(`${count} files are missing — relink them`, `ဖိုင် ${myNumber(count)} ခု ပျောက်နေသည် — ပြန်ချိတ်ပါ`));
