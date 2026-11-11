# VERIFY.md — v2 editor စစ်ဆေးမှု အစီရင်ခံစာ (main @ `6e6bf1e`၊ Nov 2026)

စစ်သူ: Claude (sandbox မှာ headless Chromium 131 + node)။ **သင့်ရဲ့ Chrome အစစ်မှာ မစမ်းရသေး** — ဒါကြောင့် "PASS" ဆိုတာ ကျွန်တော့်စမ်းသပ်ပတ်ဝန်းကျင်မှာ ကိုက်တာပဲ၊ အသံထွက်/မျက်စိနဲ့ကြည့်တာတွေ မပါပါ။
ပြန်စစ်နည်း: `node public/v2/tests/verify/known-bugs.mjs` (ပြင်ပြီးရင် အားလုံး PASS ဖြစ်ရမယ်)၊ `node public/v2/tests/unit/*.mjs`၊ e2e = `tests/harness.md`။

## ၁။ အနှစ်ချုပ်

| | |
|---|---|
| Unit tests (၅ ဖိုင်၊ other session ရေးထားတာ + ကျွန်တော့် ၈ ခု) | ✅ အားလုံးအောင် |
| E2E (text/timeline/autosave/projects/theme — ၁၄ checks) | ✅ အားလုံးအောင်၊ page error မရှိ |
| Media import → tile → "Audio clip" Timeline ပေါ်ရောက် | ✅ |
| Text tool presets (Add text / Title card / Credits / Quote / Lower third / Karaoke) | ✅ clip ထည့်တယ် |
| Auto-draft (voice + ကဗျာ → စာတန်းချိန်) | ✅ ဖတ်သံ ၃ ပိုင်း (0.5 / 3.2 / 5.9 s) ကို 0.51 / 3.18 / 5.88 s နဲ့ ကိုက် |
| SRT (`textToSrt`) | ✅ format မှန်၊ မြန်မာစာ မပြောင်း |
| Timeline ops (text split+undo၊ ripple/plain delete၊ lock၊ trim limit) | ✅ |
| MP4 export (စာသီးသန့်၊ အသံမပါ) | ✅ H.264 1280×720 30fps၊ ၁၈၀ frame၊ ၆.၀ s (ffprobe) |
| **MP4 / WebM export (အသံပါရင်)** | ❌ **မအောင် — B2, B3** |
| **ကဗျာ စာသား** (Unicode မှန်ကို paste) | ❌ **စာပျက် — B1** |
| **Audio split / trim-left** | ❌ **B4** |

## ၂။ တွေ့တဲ့ အမှားများ (ပြင်ရမယ့်အစဉ်)

### B1 — CRITICAL: `normalizeMyanmar` က မှန်တဲ့ Unicode မြန်မာစာကို ဖျက်ဆီးတယ်
- `engine/text.js` က `ေ`+ဗျည်း ကို `ဗျည်း`+`ေ` လို့ လဲပြီး `္` ကို `်` လို့လဲတယ်။ မှန်တဲ့ Unicode မှာ `ေ` ရဲ့နောက် ဗျည်းလာတာ ပုံမှန် (ရေကို၊ တွေကို …) ဖြစ်လို့ **စာပျက်**။
- အထောက်အထား: `တွေကို → တွကေို`၊ `ရေကို → ရကေို`၊ `ဗုဒ္ဓ → ဗုဒ်ဓ`၊ `မန္တလေး → မန်တလေး`။ UI မှာ ကဗျာ paste → "Add lines as clips" လုပ်တာနဲ့ clip စာသား ပျက်တာ တိုက်ရိုက်တွေ့ (`ကျွန်တော် သူငယ်ချင်းတွကေို ချစ်တယ်`)။ `addLines` / `addTimedLines` က ဒါကို အမြဲခေါ်နေတယ်။
- Zawgyi ကို ပြောင်းဖို့လည်း မရ (`ျမန္မာ` မပြောင်း)။
- **ပြင်ရန်**: စာသားကို မပြောင်းဘဲ ထည့်၊ Zawgyi→Unicode ကို v1 လို `rabbit-node` (`Rabbit.zg2uni`) နဲ့ **ခလုတ်ဖြင့်/Zawgyi ဟု ခန့်မှန်းရင် confirm ပြီး** ပဲလုပ်။

### B2 — CRITICAL: အသံပါတဲ့ project ကို Export လုပ်ရင် အမြဲမအောင်
- `engine/export.js` `createMediabunnyJob` က `output.start()` ကို audio track မထည့်ခင် ခေါ်ထားတယ်။ Error: **"Cannot add track after output has been started or canceled."**
- **ပြင်ရန်**: offline audio ကို အရင် render → video track နဲ့ audio track နှစ်ခုလုံး `addVideoTrack/addAudioTrack` လုပ်ပြီးမှ `output.start()`။

### B3 — HIGH: WebM export ပျက်
- `new mb.WebmOutputFormat()` — Mediabunny ရဲ့ အမည်က **`WebMOutputFormat`** (M အကြီး)။ Error: `mb.WebmOutputFormat is not a constructor`။

### B4 — HIGH: Audio clip ကို Split / ဘယ်အစွန်း trim လုပ်ရင် အသံက ဖိုင်အစကနေ ပြန်စ
- Audio clip မှာ ဖိုင်ထဲက စတင်တဲ့နေရာ (`in`) မရှိ။ `splitClip` ရဲ့ ညာတစ်ဝက် = `{start:4, dur:4}` ပဲ၊ `audio.js` က `offset = now - c.start` နဲ့ `renderOfflineAudio` က `source.start(c.start, 0, …)` သုံးလို့ ညာတစ်ဝက်က ဖိုင်အစကို ပြန်ဖွင့်တယ်။ trim-left လည်း အသံက ရွေ့သွား။
- **ပြင်ရန်**: audio/video clip မှာ `in` (စက္ကန့်) ထည့်။ split: `right.in = left.in + (cut - start)`; trim-left: `in += delta`; preview `offset = now - start + in`; export `source.start(c.start, c.in, c.dur)`; project ဟောင်းအတွက် default `in=0`။

### B5 — HIGH (နားနဲ့ မစစ်ရသေး): Preview အသံကို play လုပ်နေစဉ် တစ်စက္ကန့် ~၈ ခါ seek
- `<audio>.currentTime` ကို ၂.၂ s play အတွင်း **၁၇ ကြိမ်** သတ်မှတ် (`window.__seeks`)။ Sync က tick တိုင်း (၀.၁၂ s) seek လုပ်နေ → အသံ တုန်/ကျိတ် ဖြစ်နိုင်။
- **ပြင်ရန်**: play/seek/clip ပြောင်းချိန်ပဲ seek၊ play နေစဉ် drift > ~၀.၃ s ရှိမှ ပြင်။

### B6 — MEDIUM (code ဖတ်ပြီး တွေ့၊ မ run ရသေး): Export အသံက Preview နဲ့ မတူ
- `renderOfflineAudio` က gain / pan / fade / ducking ပဲသုံး — EQ၊ compressor၊ reverb၊ echo၊ loop မသုံး။ (Plan ရဲ့ "Preview = Export" နိယာမ ပျက်။)
- **ပြင်ရန်**: Preview နဲ့ Export က graph builder တစ်ခုတည်းကို ဝေမျှသုံး (v1 `audio.js` `buildBus` ပုံစံ)။

### B7 — MEDIUM: Clip တစ်ခုကို တစ်ခုပေါ် ဆွဲတင်လို့ရ (track တူ)
- `moveClip` မှာ တိုက်မိမှု မစစ် (b.start=0.5၊ a ကတော့ 3 အထိ)။ **ပြင်ရန်**: နီးစပ်ရာ clip အစွန်းမှာ ရပ်/တွန်း၊ ဒါမှမဟုတ် lane ထပ်ဖွဲ့။

### B8 — MEDIUM: AAC မရတဲ့ browser မှာ Opus fallback မရှိ
- MP4 အတွက် `aac` ကို အမြဲသုံး။ ဒီ test Chromium မှာ `AudioEncoder.isConfigSupported(aac)=false` ဖြစ်ပြီး (Linux Chrome စသည်ဖြင့် အဲလိုဖြစ်နိုင်)။ v1 မှာ AAC မရရင် Opus သုံးတာ ရှိခဲ့။ **ပြင်ရန်**: `isConfigSupported` စစ်ပြီး fallback။

### သေးငယ်တာ
- SRT ကို BOM မပါ UTF-8 နဲ့ထုတ် — တချို့ player မှာ မြန်မာစာ မှန်ဖို့ BOM ထည့်ရင် ပိုကောင်း။
- Timeline မူလ zoom 10 px/s — clip တွေ ကျဉ်းလွန်း၊ ၆၀ px/s လောက်ကနေ စ (editor.css ထဲ မပါ၊ `main.js` pps)။
- `Local media မရှိသေးပါ` empty state က ကျဉ်းပြီး စာကွဲ (CSS)။

## ၃။ မစစ်ရသေးတာ (သင့် browser မှာ စစ်ဖို့လို)

- အသံတကယ်ထွက်ခြင်း၊ B5 ရဲ့ stutter၊ ဖတ်သံ/Music ကိုက်မကိုက်၊ Ducking၊ EQ/Reverb ကြားရတာ။
- Timeline ကို mouse နဲ့ ဆွဲ/trim/box-select/snap (action ကိုပဲ node နဲ့စစ်ပြီး၊ pointer gesture ကို မစစ်ရသေး)။
- Record tab (microphone)၊ Library tab (R2 ကို sandbox မှာ မရှိ)၊ R2 Fonts။
- Video/Photo clip၊ Overlay logo၊ Filters/Adjust၊ Transitions၊ Text effect ၁၅ ခုနဲ့ animation ရဲ့ မြန်မာစာ rendering (sandbox မှာ မြန်မာ font မရှိ)။
- Export ရဲ့ အကြောင်းအရာ မျက်စိနဲ့ကြည့်ခြင်း (ကျွန်တော်က ffprobe ပဲ စစ်) နဲ့ VLC/ဖုန်းမှာ ဖွင့်ကြည့်ခြင်း၊ ရှည်တဲ့ export (၁၀ မိနစ်+)။
- Cloudflare Access၊ ASR (ရပ်ထား)။

## ၄။ အကြံပြုချက်

B1 နဲ့ B2 ကို **ပထမဆုံး** ပြင်ပါ — ကဗျာစာသား မပျက်ဘဲ MP4 (အသံပါ) ထုတ်လို့ရမှသာ ဒီ app က အသုံးဝင်တယ်။ ပြီးရင် B4 → B3 → B5 → B8 → B6 → B7။
စာတန်း ပြင်တဲ့ session တစ်ခုထက်ပိုရင် repo ကို `git pull` မလုပ်ဘဲ push မလုပ်ပါနဲ့ (ယခင်က ဖိုင်ထပ်ရေးခံရတာ ၂ ကြိမ်ကြုံ)။
