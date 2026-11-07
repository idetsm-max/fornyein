// Labels are English (like the design); the second value is the Burmese tooltip. Change here to re-label the whole app.
const S = {
  home: ['Home', 'ပင်မစာမျက်နှာ'], projects: ['My Projects', 'ကျွန်ုပ်၏ project များ'], preview: ['Preview', 'ကြည့်မယ်'], export: ['Export', 'MP4 ထုတ်မယ်'],
  undo: ['Undo', 'နောက်ပြန်'], redo: ['Redo', 'ပြန်လုပ်'], fullscreen: ['Fullscreen', 'မျက်နှာပြင်အပြည့်'],
  media: ['Media', 'ပုံ၊ ဗီဒီယို၊ ဖိုင်များ'], audio: ['Audio', 'အသံ၊ Music၊ SE'], text: ['Text', 'စာသား၊ စာတန်းများ'], stickers: ['Stickers', 'Sticker၊ Logo'],
  effects: ['Effects', 'Effect များ'], transitions: ['Transitions', 'ကူးပြောင်းမှု'], filters: ['Filters', 'အရောင် filter'], adjust: ['Adjust', 'အလင်း၊ အရောင်ညှိ'],
  templates: ['Templates', 'ပုံစံအသင့်'], more: ['More', 'နောက်ထပ်'],
  local: ['Local', 'ကိုယ့်ကွန်ပျူတာ'], library: ['Library', 'R2 library'], record: ['Record', 'အသံသွင်း'], upload: ['Upload Media', 'ဖိုင်တင်'],
  all: ['All', 'အားလုံး'], videos: ['Videos', 'ဗီဒီယို'], photos: ['Photos', 'ဓာတ်ပုံ'], audios: ['Audio', 'အသံ'], addMore: ['Add More', 'ထပ်ထည့်'],
  tText: ['Text', 'စာသား'], tAnimation: ['Animation', 'Animation'], tTiming: ['Timing', 'အချိန်'],
  font: ['Font', 'စာလုံးပုံစံ'], style: ['Style', 'ပုံစံ'], color: ['Color', 'အရောင်'], stroke: ['Stroke', 'အနားကွပ်'], size: ['Size', 'အရွယ်'], opacity: ['Opacity', 'ထင်ရှားမှု'],
  position: ['Position', 'နေရာ'], rotate: ['Rotate', 'လှည့်'],
  trending: ['Trending', 'လူကြိုက်များ'], basic: ['Basic', 'အခြေခံ'], retro: ['Retro', 'Retro'], bw: ['B&W', 'အဖြူအမည်း'], blur: ['Blur', 'Blur'],
  saved: ['Auto Saved', 'အလိုအလျောက် သိမ်းပြီး'], project: ['Project', 'Project'], resolution: ['Resolution', 'Resolution'], save: ['Save Project', 'Project သိမ်း'], exportVideo: ['Export Video', 'ဗီဒီယို ထုတ်မယ်'],
  trackText: ['Text', 'စာတန်း track'], trackVideo: ['Video', 'ဗီဒီယို / နောက်ခံ track'], trackOverlay: ['Overlay', 'Overlay / Logo track'], trackAudio: ['Audio', 'အသံ track'],
};
export const L = (k) => (S[k] ? S[k][0] : k);   // label
export const H = (k) => (S[k] ? S[k][1] : '');  // Burmese tooltip
