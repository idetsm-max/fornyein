// Inspector tabs are data: a clip kind maps to the tabs that actually work for it,
// so selecting an audio clip never shows text-only controls (G1).
const tab = (key, label, tip) => ({ key, label, tip });

export const INSPECTOR_TABS = {
  text: [tab('text', 'Text', 'စာသား'), tab('anim', 'Animation', 'Animation'), tab('timing', 'Timing', 'အချိန်')],
  audio: [tab('basic', 'Basic', 'အခြေခံ အသံ'), tab('effects', 'Effects', 'EQ၊ Reverb၊ Echo')],
  video: [tab('video', 'Video', 'ဗီဒီယို'), tab('adjust', 'Adjust', 'အလင်း၊ အရောင်')],
  image: [tab('video', 'Video', 'ပုံ'), tab('adjust', 'Adjust', 'အလင်း၊ အရောင်')],
  sticker: [tab('basic', 'Basic', 'အခြေခံ')],
  project: [tab('project', 'Project', 'Project ဆက်တင်')],
};

export const tabsFor = (kind) => INSPECTOR_TABS[kind] || INSPECTOR_TABS.project;
