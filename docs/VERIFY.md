# VERIFY.md — v2 editor စစ်ဆေးမှု အစီရင်ခံစာ (Nov 2026)

နောက်ဆုံး update: 2026-11-23၊ `feat/stabilization-s1-s2` (S3 src{in,out}၊ S4 audio clock၊ S5 lanes၊ S6 shared graph၊ S7 CI/lint၊ T1 commands၊ U1–U6 UX)။ စမ်းသပ်သူ: OpenHands၊ Node.js unit/regression + headless Chromium 131 (phase1 + ux e2e)။ ffprobe စစ်ဆေးမှုကို 2026-11-12 session မှာ ရလဒ်ရှိပြီး၊ ယခု sandbox တွင် ffprobe မရှိ၍ ပြန်မစစ်ရပါ။ သင့်ကိုယ်ပိုင် Chrome၊ VLC/ဖုန်းမှာ လက်ဖြင့်စစ်ခြင်း မလုပ်ရသေးပါ။

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
| **B4 source range (S3)** | ✅ ပြင်ပြီး | schema v4 `src{mediaId,in,out}` + `engine/clip.js` + `engine/migrate.js`။ split ညာတစ်ဝက် `src.in=4`၊ trim-left `src.in=3, out=8` — `known-bugs` ၂ ခု PASS |
| **B7 lane overlap (S5)** | ✅ ပြင်ပြီး | `engine/lanes.js` — move/add/paste/duplicate အားလုံး free slot ရှာပြီး lane မထပ်စေ။ known-bugs PASS + unit property test ၃၀၀ move |
| **S4/B5 audio clock** | ✅ code + e2e | AudioContext clock ပေါ်တွင် AudioBufferSource scheduling (long media = element path)၊ playhead ကို rAF က ဆက် drive ပြီး ကွာဟမှု 0.12 s ကျော်ရင် reschedule။ e2e: `scheduled=1`, ctx running, media-element `currentTime` ရေး 0 ကြိမ်၊ pause က sources ရပ် |
| **S6/B6 preview=export** | ✅ code + e2e | `audio-graph.js` တစ်ခုတည်းကို preview/export နှစ်ခုလုံးသုံး (EQ/comp/echo/reverb/loop/duck/fade)၊ deterministic IR၊ render ၂ ခု diff 0။ spectrum A/B capture မလုပ်ရသေး |
| Unit tests | ✅ ၇၄ ခု အားလုံးအောင် | engine 8၊ model-v4 11၊ phase5 7၊ phase6 9၊ phase7 4၊ phase8 3၊ playback 10၊ timeline-commands 13၊ timeline 9 |
| E2E browser tests | ✅ phase1 ၁၄ + ux ၁၂ + audio ၁၀ + layout ၁၃ | `tests/e2e/{phase1,ux,audio,layout}.js` (headless Chromium) — page error မရှိ |
| **S7 CI/lint** | ✅ | `.github/workflows/test.yml`၊ `scripts/lint-lines.mjs` (line budget ratchet) |

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

### B4 — Audio split/trim-left မှ source in-point ပျောက်ခြင်း — ပြင်ပြီး

Media clip တိုင်းတွင် `src{mediaId,in,out}` ရှိပြီ။ `splitClip` က ညာတစ်ဝက်၏ `src.in` ကို ဖြတ်သည့်နေရာအထိ ရွှေ့သည်၊ `trimClip('left')` က `src.in` ကို တိုးသည်၊ `trimClip('right')` က `src.out` ကို ချိန်သည်၊ `slipClip` က window ကို ရွှေ့သည်။ `migrate()` က v3 project ကို v4 သို့ ပြောင်းပြီး media duration ထက် မကျော်စေ။ Preview/export/render အားလုံး `srcTime()` ကိုပဲ သုံးသည်။ စစ်ဆေးချက်: `known-bugs` B4 ၂ ခု PASS၊ `model-v4.test.mjs` (split/trim/slip/migrate idempotent/random-move property)။

### B5 — Preview audio playback တွင် seek များလွန်းခြင်း — ပြင်ပြီး (S4)၊ နားဖြင့်မစစ်ရသေး

Preview က ယခု AudioContext ကို master clock အဖြစ်သုံးပြီး `AudioBufferSourceNode` ကို ကြိုတင် schedule လုပ်သည် (25 MB ကျော် ဖိုင်အတွက် `<audio>` + MediaElementSource path၊ seek ကို စတင်ချိန်ပဲ လုပ်သည်)။ Reschedule က play/seek/edit (debounce 120 ms) မှာပဲ ဖြစ်ပြီး သဘာဝ tick နဲ့ ကွာဟမှု 0.12 s ကျော်မှ seek လုပ်သည်။ `visibilitychange` မှာ pause လုပ်သည်။ e2e `audio.js`: `scheduled=1`၊ ctx `running`၊ media-element `currentTime` ရေး 0 ကြိမ်၊ pause မှာ sources ရပ်။ နားဖြင့် stutter/A-V sync စစ်ရန် လိုအပ်ဆဲ။

### B6 — Export audio DSP parity မပြည့်ခြင်း — ပြင်ပြီး (S6)

`engine/audio-graph.js` က per-clip chain (EQ ၃ ခု → compressor → dry/echo/reverb → gain envelope → pan) နဲ့ track bus/master limiter ကို တစ်နေရာတည်း ဆောက်သည်။ Preview (`playback.js`) နဲ့ export (`renderOfflineAudio`) နှစ်ခုလုံး `startBufferClip()` တစ်ခုတည်းကို သုံးသဖြင့် EQ/compressor/echo/reverb/loop/ducking/fade အားလုံး တူညီသည်။ Reverb impulse ကို seeded PRNG နဲ့ ဆောက်သဖြင့် render တစ်ခုနဲ့တစ်ခု bit-identical (e2e diff 0)။ ကျန်တာ: တကယ့် preview capture နဲ့ export ကို spectrum နှိုင်းယှဉ်ခြင်း။

### B7 — တူညီသော track ပေါ် clip ထပ်တင်နိုင်ခြင်း — ပြင်ပြီး

`engine/lanes.js` က free slot ကို ရှာပြီး လိုအပ်ရင် lane အသစ် (`Text 2`၊ `Audio 2`) ဖွဲ့သည်။ `moveClip`/`addMedia`/paste/duplicate အားလုံး ဒီစည်းမျဉ်းကို သုံးသည်။ စစ်ဆေးချက်: known-bugs B7 PASS + ၃၀၀ ကြိမ် ကျပန်း move property test။

### B8 — AAC မရသည့် browser အတွက် Opus fallback မရှိခြင်း — ပြင်ပြီး၊ MP4 စစ်ပြီး

Container ကခွင့်ပြုသော audio codec များအနက် Mediabunny encodability query ဖြင့် ရွေးသည်။ MP4 မှာ AAC မရလျှင် Opus ကို ရွေးနိုင်သည်။ စမ်းသပ်ခဲ့သော Chromium တွင် Opus တစ်ခုသာ encodable ဖြစ်ပြီး တကယ့် MP4 ထဲတွင် Opus audio stream ပါကြောင်း ffprobe ဖြင့်စစ်ပြီးဖြစ်သည်။

### ဤ slice တွင် ပြီးသွားသော အခြားအချက်များ

- **S7**: `.github/workflows/test.yml` (unit + known-bugs + lint + syntax)၊ `scripts/lint-lines.mjs` ratchet (ဖိုင် ≤ ၃၀၀ လိုင်း၊ လိုင်း ≤ ၁၆၀)၊ SRT UTF-8 BOM၊ timeline default zoom ၆၀ px/s၊ empty-state စာကွဲပြင်ဆင်။
- **U1 (G1)**: `ui/inspector-registry.js` — clip kind → tabs (Text/Animation/Timing၊ Audio: Basic/Effects၊ Video/Image: Video/Adjust၊ မရွေးရင် Project settings)။ e2e စစ်ပြီး။
- **U2 (G2)**: `ui/menus.js` + `ui/context-menu.js` — clip/track/ruler/media right-click၊ clipboard (Ctrl+C/X/V)၊ lane-safe paste။ e2e စစ်ပြီး။
- **U3 (G3)**: media tile ကို drag → timeline/player ချ၊ ဖိုင် drag → Media panel import၊ drop indicator။ e2e စစ်ပြီး။
- **S4**: `engine/playback.js` — pure `planSchedule()` + live engine (AudioContext clock၊ buffer/element path၊ debounce reschedule၊ visibility pause၊ meters)။ unit ၁၀ + e2e ၁၀။
- **S6**: `engine/audio-graph.js` — shared preview/export graph၊ seeded IR၊ limiter၊ track buses။ e2e parity diff 0။
- **T1**: `engine/timeline.js` — move/trim(ripple,roll)/split(all)/slip/slide/delete/lift/extract/insert/overwrite/setProp၊ locked guard၊ one-step undo + `history.js` labels။ unit ၁၃။
- **U4**: splitters (left 240–480၊ inspector 280–420၊ timeline 200–60%)၊ double-click reset၊ collapse toggles၊ localStorage။ e2e စစ်ပြီး။
- **U5**: track header mute/solo၊ double-click rename၊ height S/M/L (context menu)။ e2e စစ်ပြီး။
- **U6/T2**: razor tool (B/V)၊ fit (Shift+Z)၊ delete left/right (Q/W)၊ undo tooltip label။ e2e စစ်ပြီး။

### မပြီးသေးသည့်အချက်များ

T2 ကျန် gesture (ripple/roll/slip drag, In/Out, magnet)၊ T3–T6၊ U4 splitters/collapse၊ U5 track header mute/solo/rename၊ U6 toolbar (razor/marker/in-out/fit)၊ U7 player handles/guides၊ font/rendering matrix၊ မူပိုင် R2 font၊ Cloudflare Access၊ ASR benchmark။

## ၃။ User Chrome တွင် လက်ဖြင့်စစ်ရန်

- Browser မှ တကယ့် Zawgyi စာသား convert လုပ်ပြီး မြန်မာစာရလဒ်ကို ပြန်စစ်ရန်။
- သင့် Chrome တွင် upload, playback, အသံကြားခြင်း, mute/solo/ducking, EQ/reverb/echo နားထောင်ခြင်း။
- Mouse ဖြင့် move/trim/split/snap, undo/redo လုပ်ခြင်း။
- Right-click menu (clip/track/ruler)၊ Ctrl+C/X/V paste၊ media tile ကို timeline ပေါ် drag ချခြင်း။
- Audio clip ရွေးရင် Inspector က Basic/Effects ပဲပြ၊ Video clip ရွေးရင် Video/Adjust ပဲပြ။
- သီချင်းတစ်ပုဒ်ကို EQ/reverb/echo ဖွင့်ပြီး preview နဲ့ export ကို နားနှိုင်းယှဉ်ခြင်း (S6)။
- Panel တွေ ဆွဲချဲ့/ချုံ့၊ ပိတ်/ဖွင့်၊ track rename/mute/solo/height ကို သင့် Chrome မှာ စမ်းခြင်း (U4/U5)။
- မိနစ် ၁၀ ကျော် အသံဖိုင်နဲ့ playback/seek စမ်းခြင်း (element path)။
- MP4/WebM ကို VLC နှင့် ဖုန်းတွင်ဖွင့်စစ်ခြင်း၊ အချိန်ရှည် export စမ်းခြင်း။
- Myanmar fonts, text effects/animation နှင့် R2 private fonts ကိုစစ်ခြင်း။

ဤစာရင်းမပြီးသေးမချင်း Plan.md ၏ stabilization/release အခြေအနေကို အစိမ်းမပြောင်းရ။
