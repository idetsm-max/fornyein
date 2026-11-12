# VERIFY.md — v2 editor စစ်ဆေးမှု အစီရင်ခံစာ (Nov 2026)

နောက်ဆုံး update: 2026-11-12၊ `feat/stabilization-s1-s2` အလုပ်လုပ်နေစဉ်။ စမ်းသပ်သူ: Manus၊ Node.js unit/regression tests၊ Chromium browser export၊ ffprobe။ သင့်ကိုယ်ပိုင် Chrome၊ VLC/ဖုန်းမှာ လက်ဖြင့်စစ်ခြင်း မလုပ်ရသေးပါ။

ပြန်စစ်ရန်:

```sh
for f in public/v2/tests/unit/*.mjs; do node "$f"; done
node public/v2/tests/verify/known-bugs.mjs
node scripts/validate-export.mjs <file> --duration 6 --tolerance 0.1
```

## ၁။ အနှစ်ချုပ်

| စစ်ဆေးချက် | အခြေအနေ | အထောက်အထား |
|---|---|---|
| Unit tests | ✅ ၄၀ ခု အားလုံးအောင် | `public/v2/tests/unit/*.mjs` — engine 8၊ phase5 7၊ phase6 9၊ phase7 4၊ phase8 3၊ timeline 9 |
| B1 Myanmar Unicode integrity | ✅ regression အောင် | `known-bugs.mjs` တွင် Unicode စကားစု ၆ ခုနှင့် Add lines/Auto-draft/ASR path စစ်၊ browser UI မှ Add lines လုပ်ပြီး `တွေကို ရေကို ဗုဒ္ဓ မန္တလေး` မပြောင်းကြောင်းစစ် |
| B2 MP4 audio export | ✅ | Chromium ထုတ် 720p ဖိုင်ကို ffprobe စစ်: H.264 video + Opus audio၊ 180 frames၊ video 6.000s၊ audio/file 6.0135s၊ A/V drift 0.0135s |
| B3 WebM format | ✅ | Chromium ထုတ် WebM: VP9 video + Opus audio၊ 30 fps၊ container duration 6.020s; ffprobe စစ် |
| B8 AAC → Opus fallback | ✅ | Browser `getEncodableAudioCodecs` က Opus ကိုသာရကြောင်း၊ MP4 export ထဲ Opus audio stream ရကြောင်း စစ် |
| Known bugs ကျန် | 🔴 B4၊ B7 | B4 split/trim-left audio source range မရှိသေး (စစ်ချက် ၂ ခုကျ)၊ B7 track တူ clip overlap တားဆီးမှု မရှိ (စစ်ချက် ၁ ခုကျ) |
| E2E browser tests | ✅ ၁၄/၁၄ pass | `public/v2/tests/e2e/phase1.js` ကို headless Chromium မှာ run; text fade-in 0.5s ပြီးမှ canvas ကိုစစ်အောင် flaky test timing ပြင် |

`node scripts/validate-export.mjs` ရလဒ်:

- MP4: `ok: true`, H.264 + Opus, file duration 6.0135s, A/V drift 0.0135s (သတ်မှတ် 0.1s အောက်)။
- WebM: `ok: true`, VP9 + Opus, format duration 6.02s။ ffprobe က stream တစ်ခုချင်း duration မပြန်ပေးသဖြင့် `avDrift: null` / `avDriftCheck: unavailable in stream metadata` ဟု မှန်ကန်စွာပြသည်။ ထို့ကြောင့် WebM အတွက် stream တစ်ခုချင်း A/V drift ကို ဒီစစ်ဆေးမှုက အတည်မပြုပါ။

## ၂။ တွေ့ခဲ့သည့် bug များနှင့် လက်ရှိအခြေအနေ

### B1 — Myanmar Unicode စာသားကို normalize လုပ်ရာတွင် ဖျက်ဆီးခြင်း — ပြင်ပြီး

ယခင် `normalizeMyanmar` က Unicode `ေ`/`္` စီစဉ်မှုကို အစားထိုးပြီး `တွေကို → တွကေို`, `ဗုဒ္ဓ → ဗုဒ်ဓ` လို စာပျက်စေခဲ့သည်။ ယခု helper သည် input ကို အတိအကျပြန်ပေးသည်။ Add lines, Auto-draft နှင့် ASR caption ထည့်ရာမှ အလိုအလျောက် normalization ကို ဖယ်ထားသည်။ Zawgyi → Unicode ကိုသာ သီးခြား Rabbit converter နဲ့ အသုံးပြုသူ ခလုတ်နှိပ်ပြီး သတိပေးချက်ကို အတည်ပြုမှ လုပ်သည်။ Unit/regression tests နှင့် browser UI Add-lines စစ်ချက် အောင်သည်။ Rabbit CDN မှ တကယ် convert လုပ်သည့် live browser စစ်ချက်ကို မလုပ်ရသေးပါ။

### B2 — အသံပါ project export မအောင်ခြင်း — ပြင်ပြီး၊ MP4 စစ်ပြီး

Offline audio ကို ပထမ render လုပ်၊ video/audio tracks အားလုံးကို `output.start()` မတိုင်မီ register လုပ်ပြီးမှ output စတင်သည်။ Audio/video source များကို data ပေးပြီးသည်နှင့် close လုပ်ကာ `finalize()` အဆုံးသတ်စေသည်။ Chromium က 6-second audio project ကို export လုပ်နိုင်ပြီး ffprobe က H.264 + Opus, 6.0135s, drift 13.5ms ပြသည်။

### B3 — WebM output format class အမည်မှားခြင်း — ပြင်ပြီး၊ WebM စစ်ပြီး

`WebmOutputFormat` ကို Mediabunny မှန်ကန်သော `WebMOutputFormat` သို့ ပြင်ထားသည်။ Browser export က VP9 + Opus WebM ဖိုင်ထုတ်ပြီး `matroska,webm` container၊ 6.02s duration ရသည်။

### B4 — Audio split/trim-left မှ source in-point ပျောက်ခြင်း — မပြင်ရသေး

Audio clip model မှာ source ထဲက စသည့်နေရာ မသိမ်းသေး။ `known-bugs.mjs` တွင် split-right နှင့် trim-left စစ်ချက် ၂ ခု ကျနေဆဲ။ Timeline source-range migration လိုအပ်သည်။

### B5 — Preview audio playback တွင် seek များလွန်းခြင်း — မပြင်ရသေး၊ နားဖြင့်မစစ်ရသေး

ယခင် verification တွင် 2.2s အတွင်း `currentTime` ကို 17 ကြိမ် ပြင်ခဲ့ကြောင်း မှတ်တမ်းရှိသည်။ ဤ session တွင် audio scheduling မပြင်၊ stutter ကိုနားဖြင့်လည်း မစစ်ခဲ့ပါ။

### B6 — Export audio DSP parity မပြည့်ခြင်း — မပြင်ရသေး

Offline export audio သည် gain/pan/fade/ducking သာသုံးပြီး Preview ထဲက EQ/compressor/reverb/echo/loop graph ကို မမျှဝေသေးပါ။ Spectrum parity စမ်းသပ်မှုလည်း မလုပ်ရသေး။

### B7 — တူညီသော track ပေါ် clip ထပ်တင်နိုင်ခြင်း — မပြင်ရသေး

`known-bugs.mjs` တွင် clip overlap စစ်ချက် ကျနေဆဲ။

### B8 — AAC မရသည့် browser အတွက် Opus fallback မရှိခြင်း — ပြင်ပြီး၊ MP4 စစ်ပြီး

Container ကခွင့်ပြုသော audio codec များအနက် Mediabunny encodability query ဖြင့် ရွေးသည်။ MP4 မှာ AAC မရလျှင် Opus ကို ရွေးနိုင်သည်။ စမ်းသပ်ခဲ့သော Chromium တွင် Opus တစ်ခုသာ encodable ဖြစ်ပြီး တကယ့် MP4 ထဲတွင် Opus audio stream ပါကြောင်း ffprobe ဖြင့်စစ်ပြီးဖြစ်သည်။

### အခြား မပြီးသေးသည့်အချက်များ

SRT UTF-8 BOM၊ မူလ timeline zoom၊ empty-state CSS၊ audio graph DSP parity၊ လက်ရှိ E2E regression၊ CI workflow၊ font/rendering matrix၊ မူပိုင် R2 font၊ Cloudflare Access နှင့် local ASR benchmark ကို မလုပ်ရသေးပါ။

## ၃။ User Chrome တွင် လက်ဖြင့်စစ်ရန်

- Browser မှ တကယ့် Zawgyi စာသား convert လုပ်ပြီး မြန်မာစာရလဒ်ကို ပြန်စစ်ရန်။
- သင့် Chrome တွင် upload, playback, အသံကြားခြင်း, mute/solo/ducking, EQ/reverb/echo နားထောင်ခြင်း။
- Mouse ဖြင့် move/trim/split/snap, undo/redo လုပ်ခြင်း။
- MP4/WebM ကို VLC နှင့် ဖုန်းတွင်ဖွင့်စစ်ခြင်း၊ အချိန်ရှည် export စမ်းခြင်း။
- Myanmar fonts, text effects/animation နှင့် R2 private fonts ကိုစစ်ခြင်း။

ဤစာရင်းမပြီးသေးမချင်း Plan.md ၏ stabilization/release အခြေအနေကို အစိမ်းမပြောင်းရ။
