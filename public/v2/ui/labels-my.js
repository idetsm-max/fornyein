import { getLocale } from './locale-core.js';

// Inspector terms that are not covered by the rail/top-bar dictionary.
const MY = {
  Ratio: 'အချိုး', FPS: 'FPS', Background: 'နောက်ခံ', 'Track volume': 'Track အသံ', 'Track pan': 'Track ဘယ်/ညာ',
  Ducking: 'အသံလျှော့', Gain: 'အသံတိုး', Volume: 'အသံ', Pan: 'ဘယ်/ညာ', 'EQ Low': 'EQ နိမ့်', 'EQ Mid': 'EQ အလယ်',
  'EQ High': 'EQ မြင့်', Compressor: 'Compressor', Echo: 'ပြန်သံ', Reverb: 'Reverb', Bypass: 'ပိတ်/ဖွင့်',
  'Fade in': 'အသံဝင်', 'Fade out': 'အသံထွက်', Loop: 'ပြန်ဖွင့်', Start: 'စတင်', Duration: 'ကြာချိန်',
  Fit: 'အံကိုက်', Opacity: 'အလင်းဖောက်မှု', 'Logo size': 'Logo အရွယ်', Brightness: 'အလင်း',
  Contrast: 'အရောင်ခြားမှု', Saturation: 'အရောင်စို', Blur: 'ဝါးမှုန်', Temperature: 'အပူချိန်', Tint: 'ရောင်စဉ်စောင့်', Fade: 'မှိန်ခြင်း',
  Vignette: 'အနားမှောင်', Intensity: 'အားပြင်းမှု', Reset: 'ပြန်လည်သတ်မှတ်', 'Transition in': 'ဝင် transition',
  'Transition out': 'ထွက် transition', Reveal: 'စာပေါ်ပုံ', 'Fill 2 / Gradient': 'အရောင် ၂ / gradient',
  Shadow: 'အရိပ်', Glow: 'အလင်းရောင်', Effects: 'Effect', In: 'ဝင်လာ', Out: 'ထွက်သွား',
  'In duration': 'ဝင်ချိန်', 'Out duration': 'ထွက်ချိန်', Width: 'အကျယ်', Height: 'အမြင့်',
  'Position X': 'နေရာ X', 'Position Y': 'နေရာ Y', 'Invert mask': 'မတ်စ်ပြောင်းပြန်', Mask: 'မတ်စ်',
  Speed: 'အမြန်နှုန်း', 'Custom speed': 'အမြန်နှုန်း ရွေး', Reverse: 'ပြောင်းပြန်', Keys: 'ကီးများ',
  Text: 'စာသား', Animation: 'လှုပ်ရှားမှု', Timing: 'အချိန်', Video: 'ဗီဒီယို', Adjust: 'ချိန်ညှိ',
  Glow: 'အလင်းရောင်', Shake: 'တုန်ခါ', 'Zoom In': 'ချဲ့ဝင်', Flash: 'အလင်းဖလက်', 'Film Grain': 'ဖလင်အစေ့',
  Vignette: 'အနားမှောင်', Intensity: 'အားပြင်းမှု', Chromatic: 'အရောင်ကွဲ', Fade: 'ဖျော့', Slide: 'ရွှေ့', Zoom: 'ချဲ့', Wipe: 'သုတ်',
  Warm: 'နွေး', Cool: 'အေး', Vivid: 'တောက်', Mono: 'အဖြူအမဲ', Dream: 'အိပ်မက်', Noir: 'နွားခဲ',
  Sepia: 'အညိုရောင်', Invert: 'အရောင်ပြန်', Bright: 'တောက်ပ', Hue: 'အရောင်စက်ဝိုင်း', Soft: 'နူးညံ့',
  Outline: 'အနားသတ်', Neon: 'နီယွန်', Rise: 'ပေါ်ထွက်', Spin: 'လှည့်', Dip: 'နစ်မြုပ်', None: 'မရှိ',
  Basic: 'အခြေခံ', Project: 'ပရောဂျက်', 'Select a clip': 'Clip ရွေးပါ', 'Untitled Project': 'အမည်မဲ့ ပရောဂျက်',
};

export const myLabel = (label) => (getLocale() === 'my' && MY[label]) || label;
