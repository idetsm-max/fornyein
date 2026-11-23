// Inspector tabs are data: a clip kind maps to the tabs that actually work for it,
// so selecting an audio clip never shows text-only controls (G1).
const tab = (key, label, tip) => ({ key, label, tip });

export const INSPECTOR_TABS = {
  text: [tab('text', 'Text', 'စာသား'), tab('anim', 'Animation', 'Animation'), tab('keys', 'Keys', 'Keyframe curve'), tab('timing', 'Timing', 'အချိန်')],
  audio: [tab('basic', 'Basic', 'အခြေခံ အသံ'), tab('effects', 'Effects', 'EQ၊ Reverb၊ Echo'), tab('speed', 'Speed', 'အမြန်နှုန်း')],
  video: [tab('video', 'Video', 'ဗီဒီယို'), tab('adjust', 'Adjust', 'အလင်း၊ အရောင်'), tab('keys', 'Keys', 'Keyframe curve'), tab('speed', 'Speed', 'အမြန်နှုန်း'), tab('mask', 'Mask', 'မတ်စ်')],
  image: [tab('video', 'Video', 'ပုံ'), tab('adjust', 'Adjust', 'အလင်း၊ အရောင်'), tab('keys', 'Keys', 'Keyframe curve'), tab('mask', 'Mask', 'မတ်စ်')],
  sticker: [tab('basic', 'Basic', 'အခြေခံ')],
  project: [tab('project', 'Project', 'Project ဆက်တင်')],
};

export const tabsFor = (kind) => INSPECTOR_TABS[kind] || INSPECTOR_TABS.project;
