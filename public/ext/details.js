// Details panel follows the selection (CapCut style): click a subtitle -> the "ပုံစံ" tab, click a voice clip -> the "အသံ" tab.
const FN = window.FN;
let last = '';
setInterval(() => {
  const s = FN.selection, key = s.kind + ':' + s.index;
  if (key === last) return; last = key;
  const tabs = document.querySelectorAll('.side')[1]?.querySelectorAll('.tabs button'); if (!tabs || tabs.length < 3) return;
  if (s.kind === 'sub') tabs[0].click(); else if (s.kind === 'voice') tabs[2].click();
}, 200);
