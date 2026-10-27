// Tidy module (loaded LAST): keep every card to ONE short heading + its controls.
// Removes the long explanatory paragraphs / guides that other modules add (now and whenever a card is rebuilt),
// and shortens a few headings. Controls, labels, short section titles and live status messages are never touched.
const FN = window.FN, $ = (id) => document.getElementById(id);
const MAXKEEP = 45;                                            // a static note longer than this (characters) is removed
const INTERACTIVE = 'input,select,button,textarea,canvas,audio,video,progress';
const HEAD = {
  '✨ Auto caption (Whisper — Hugging Face)': '✨ Auto caption',
  'Effect / Animation / Preset': 'Effect',
  'Credits (စာရေးသူ / ဖတ်သူ)': 'Credits',
};
const isNote = (el) => el.tagName === 'DIV' && el.classList.contains('mut') && !el.querySelector(INTERACTIVE)
  && !el.style.cssText.includes('dashed') && el.style.display !== 'none' && el.textContent.trim().length > MAXKEEP;
const isGuide = (el) => el.tagName === 'DETAILS' && !el.classList.contains('tlset') && !el.querySelector(INTERACTIVE);

function tidyNode(n) {
  if (n.nodeType !== 1) return;
  for (const el of [n, ...n.querySelectorAll('div.mut, details, b, div.hint')]) {
    if (!el.isConnected) continue;
    if (el.classList.contains('hint') && el.closest('.tl')) el.remove();                 // keyboard-shortcut line under the timeline
    else if (isNote(el) || isGuide(el)) el.remove();
    else if (el.tagName === 'B' && HEAD[el.textContent.trim()]) el.textContent = HEAD[el.textContent.trim()];
  }
}
tidyNode(document.body);
new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach(tidyNode); }).observe(document.body, { childList: true, subtree: true });

const st = $('status'); if (st && /Project အသစ်/.test(st.textContent)) st.textContent = '';
