# DECISIONS — ဆုံးဖြတ်ချက် မှတ်တမ်း (ADR) · အနိုင်ရစာတမ်း

ဒီဖိုင်ဟာ **ဆုံးဖြတ်ချက်တွေရဲ့ အတည်တကျ မှတ်တမ်း** ဖြစ်ပါတယ်။ Plan.md §၁၀ နဲ့ ကွဲလွဲရင် **ဒီဖိုင်က အနိုင်ရ** (Plan.md ကို နောက်တစ်ကြိမ်ပြင်တဲ့အခါ ညှိမယ်)။
**Status**: ✅ Accepted · 🤝 Delegated (သင်က "အကောင်းဆုံးလုပ်ပါ" ဟု လွှဲအပ်၍ ကျွန်တော်ရွေး — သင်ပြန်ပယ်/ပြင်ခွင့်ရှိ) · ⏳ Open။
ဆုံးဖြတ်ချက်အသစ်/ပြောင်းလဲမှုတိုင်း ဒီဖိုင်မှာ ရက်စွဲနဲ့ ထပ်ရေး (အဟောင်းကို မဖျက်၊ "Superseded by D#" လို့ မှတ်)။

---

## အဓိက ဦးတည်ချက်

| ID | ဆုံးဖြတ်ချက် | Status | ရက် |
|---|---|---|---|
| D0 | **ForNyein = CapCut-class web video editor (Burmese-first, browser-only)**။ ဒီဇိုင်းအားလုံး အဲဒီဘက်ကို အစကတည်းက ဦးတည်။ Poem Mode က vertical workflow။ | ✅ (user) | Nov 2026 |
| D0a | UI ရုပ်ရည် = VidPro နမူနာ (ကိုယ်ပိုင်)၊ အလုပ်လုပ်ပုံ = CapCut။ **CapCut ရဲ့ logo/icon/asset/စာသား မကူး။** | ✅ | Nov 2026 |
| D0b | **Phase S (stabilization) ကို feature အသစ်မတိုင်ခင် ပြီးရမယ်** | ✅ | Nov 2026 |

## ဖွဲ့စည်းပုံ (L2a §၇ ရဲ့ D1–D7 ကို အဖြေထုတ်)

| ID | ဆုံးဖြတ်ချက် | Status | အကြောင်းရင်း / အစားထိုးနိုင်တာ | ပြန်စဉ်းစားမယ့်အချိန် |
|---|---|---|---|---|
| D1 | Render = **`buildFrame` (pure) + Compositor**။ Backend = **Canvas2D (အခု၊ fallback) → WebGL2 (M3 မှစ)**၊ WebGPU နောက်မှ | 🤝 | WebGL2 က browser အားလုံးမှာ ပံ့ပိုး၊ ရင့်ကျက်၊ shader effect/transition/mask အတွက် ပြည့်စုံ။ WebGPU က feature/ပံ့ပိုးမှု မညီ | M5 မှာ WebGPU ပံ့ပိုးမှုကြည့် |
| D2 | Media = **OPFS** (ကြီးတဲ့ဖိုင်)၊ project JSON = IndexedDB။ (အခု IndexedDB Blob သုံးနေတာကို M3 မတိုင်ခင် OPFS ပြောင်း) | 🤝 | OPFS က ဖိုင်ကြီးတွေအတွက် မြန်၊ quota ကောင်း၊ Worker မှာ synchronous access | OPFS မပံ့ပိုးတဲ့ browser တွေ့ရင် |
| D3 | **Schema v4** (`src{in,out}`၊ `speed`၊ `transform`၊ `fx[]`၊ `mask`၊ `trIn/trOut`၊ `link`) ကို **S3 မှာ တစ်ခါတည်း ကြိုထား** (field အသုံးမပြုသေးရင် default) | 🤝 | နောက်မှ project ဖိုင်ပုံစံ ပြောင်းရင် migration အန္တရာယ်၊ အခုထည့်ရင် တန်ဖိုးနည်း | v5 လိုလာရင် (integer frame) |
| D4 | UI = **Preact + htm** (CDN ပုံသေ) ဆက်သုံး၊ build tool မသုံး | ✅ | ရှိပြီး၊ ပေါ့ပါး၊ စစ်ပြီး | bundle လိုအပ်လာရင် |
| D5 | **P1 အင်္ဂါရပ် ဦးစားပေးအစဉ်** — အောက်ပါဇယား | 🤝 | | M3 မစခင် |
| D6 | Input limit (အစ): **၁၀၈၀p၊ ≤ ၁၀ မိနစ်**၊ ပိုကြီးရင် အသိပေး (proxy = M8) | 🤝 | ၄K/ရှည်တဲ့ဗီဒီယိုက browser မှာ memory/decode အန္တရာယ်ကြီး | M8 proxy ပြီးရင် |
| D7 | Shortcut = **CapCut default နဲ့ ကိုက်အောင်** (`docs/shortcuts.md`) | 🤝 | အသုံးပြုသူ အကျင့်ပါပြီးသား | |

## UX / Timeline / Data

| ID | ဆုံးဖြတ်ချက် | Status | အကြောင်းရင်း |
|---|---|---|---|
| D8 | **Main (video) track magnet = မူလ ON** (CapCut လို)၊ audio/text lane မှာ မသက်ရောက်၊ toggle `P` ရှိ | 🤝 | CapCut အပြုအမူနဲ့ တူ၊ ကွက်လပ်မကျန်ခြင်းက အသစ်သုံးသူအတွက် ရိုးရှင်း |
| D9 | **အချိန် = စက္ကန့် (float) + frame quantize** (`round(t·fps)/fps`)။ integer frame/rational (v5) က speed curve/variable fps လိုမှ | 🤝 | ပြောင်းလဲမှုနည်း၊ drift ကို quantize ကိုင်၊ OTIO ရဲ့ rational ကို လိုရင်နောက်ပြောင်း |
| D10 | **Lane မထပ်** — ထပ်ရင် lane အသစ်အလိုအလျောက်၊ main track = insert/ပယ် | ✅ (Plan §၅.၂) | |
| D11 | UI label = **English**၊ tooltip/error/microcopy = **မြန်မာ**။ UI အပြည့်မြန်မာ toggle = P2 (M8) | 🤝 | နမူနာကိုက်၊ မြန်မာစာ rendering လုံခြုံ၊ ပြောင်းလွယ် (`strings.js`) |
| D12 | **Transitions = ထည့် (M4)**၊ **Stickers = ပေါ့ပေါ့ (logo/PNG/shape overlay၊ M3/M6)**၊ sticker library (အရောင်းအဝယ်/ကူးခွင့်) မလုပ် | 🤝 | ကဗျာဗီဒီယိုမှာ transition တန်ဖိုးရှိ၊ sticker pack လိုင်စင်ပြဿနာ |
| D13 | **Zawgyi→Unicode** = `rabbit-node` ကို **repo ထဲ vendor** (CDN မမှီခို)၊ converter ကို ကိုယ်တိုင်မရေး၊ **မပြောင်းခင် အမြဲ confirm** | 🤝 | စာမပျက်ရေး (S1)၊ offline |
| D14 | `normalizeMyanmar` **ဖျက်** (စာသားကို မပြောင်းတဲ့ policy) | ✅ | B1 |
| D15 | Export codec မူ: **MP4 = H.264+AAC** ပင်မ၊ AAC မရတဲ့စက် → **WebM (VP9+Opus)** အကြံပြုပြီး အကြောင်းရင်းပြ၊ **self-check မအောင်ရင် download မပေး** | 🤝 | broad compatibility + မမှားသော ဖိုင် |
| D16 | Audio preview = **Web Audio schedule** (`AudioBufferSourceNode`)၊ ရှည်တဲ့ media (>၁၂၀ s) = `<audio>`+MediaElementSource (start/seek မှာပဲ ထိ) | 🤝 | B5၊ memory |
| D17 | Repo စည်းမျဉ်း: **writer တစ်ယောက်**၊ WP တစ်ခု = branch/PR တစ်ခု၊ CI စိမ်းမှ merge၊ ဖိုင်/လိုင်း အရှည်ကန့်သတ် | ✅ | ဖိုင်ထပ်ရေးခံရမှု ၂ ကြိမ် |
| D18 | **ASR (Auto captions)**: benchmark (သင့်ကဗျာ ၁၀ ခု၊ CER) အောင်မှ ပေါင်းစပ် (M7)။ **မြန်မာအတွက် Workers AI Whisper မသုံး** | ✅ (စမ်းပြီး) | |
| D19 | Persona `[A]` = Facebook/TikTok/YouTube မှာ တင်မယ့် မြန်မာ short-video/ကဗျာ ဖန်တီးသူ — **သင်ပြင်ရင် ပြင်** | ⏳→🤝 | |
| D20 | Font = **private R2 `Fonts/`** ပဲ (AJ Kunheing, Aka02)၊ public repo မထည့် | ✅ | လိုင်စင် |

---

## D5 — P1 အင်္ဂါရပ် ဦးစားပေးအစဉ် (ကျွန်တော့် ရွေးချယ်မှု၊ သင်လွှဲအပ်)

**စံနှုန်း**: (က) **တန်ဖိုး** — ကဗျာ/short-video ဖန်တီးသူအတွက် (၁–၅)၊ (ခ) **အားထုတ်မှု** (၁ = လွယ်၊ ၅ = ကြီး)၊ (ဂ) **အခြေခံဖြစ်မှု** — တခြား feature တွေ မူတည်လား၊ (ဃ) **အန္တရာယ်** (၁–၅)။

| အင်္ဂါရပ် | တန်ဖိုး | အားထုတ် | အခြေခံ? | အန္တရာယ် | **အစဉ်** | Milestone |
|---|---|---|---|---|---|---|
| Text template + animation (In/Out/Loop) + SRT + Poem Mode | 5 | 3 | ✅ | 2 | **၁** | M2 |
| **Transform + Keyframes** (Ken Burns၊ PiP၊ text motion) + Overlay/Logo | 5 | 4 | ✅✅ | 2 | **၂** | M3 |
| **Adjust + Filters** (အလင်း/အရောင်/LUT-ish) | 4 | 2 | | 1 | **၃** | M4a |
| **Transitions** (fade/slide/zoom/wipe) | 4 | 3 | | 2 | **၄** | M4b |
| **Audio polish — Noise reduction + Loudness normalize + Ducking အပြီးသတ်** (အိမ်မှာ mic နဲ့ အသံသွင်းသူများ — ဆူညံမှုက အဓိကပြဿနာ) | 4 | 3 | | 3 | **၅** | M5a |
| Effects stack (glow/grain/shake/blur) | 3 | 3 | | 2 | ၆ | M4c |
| Speed / Reverse / Freeze | 3 | 3 | | 2 | ၇ | M5b |
| Stickers/Shape/Logo pack + Project/Text templates | 3 | 2 | | 1 | ၈ | M6 |
| Mask (rect/ellipse/feather) | 2 | 4 | | 3 | ၉ | M4d |
| **Auto captions** (benchmark အောင်မှ) | 5 | 5 | | 5 | **ဂိတ်** | M7 |
| Chroma key / Blend mode / Speed curve | 1–2 | 3 | | 2 | ၁၀ | နောက်ပိုင်း |
| Background removal (AI)၊ Stabilization၊ Auto reframe၊ TTS | 2 | 5 | | 5 | P3 | M7+ |
| Motion tracking · Script-to-video · Cloud/Share | — | — | — | — | **မလုပ်** | — |

**အဓိကအကြောင်းပြချက်**
1. ကဗျာဗီဒီယိုက အများအားဖြင့် **ငြိမ်တဲ့ပုံ/ဗီဒီယိုနောက်ခံ + စာ + ဖတ်သံ + Music**။ ဒါကြောင့် **Keyframes (Ken Burns အပါအဝင်) ကို အရင်ဆုံး** — text motion နဲ့ နောက်ခံလှုပ်ရှားမှု နှစ်ခုလုံးရဲ့ အခြေခံ။
2. **Adjust/Filters** က အလုပ်နည်းနည်းနဲ့ ရလဒ်ကွာခြားမှု ကြီး။ **Transitions** က ပုံ/ကဗျာ အပိုင်းကူးတဲ့အခါ ကြည့်ကောင်း။
3. **Noise reduction + loudness** ကို ကြိုတင်ထားတာက သင့်လိုအသံသွင်းသူ (ဖုန်း/laptop mic) အတွက် အရည်အသွေး ပြဿနာ အကြီးဆုံးကို ဖြေ — CapCut ကို ပြိုင်ရာမှာ ကွဲပြား။
4. **Auto captions** ကို တန်ဖိုးအမြင့်ဆုံး ဖြစ်ပေမဲ့ **အန္တရာယ်အမြင့်ဆုံး** (မြန်မာ model မတွေ့သေး) — benchmark ဂိတ်ပြီးမှ၊ မအောင်ရင် VAD + Tap-sync (ရှိပြီး) ကို အဓိကထား။
5. Mask/Chroma/Blend/Speed curve က ကဗျာအသုံးအတွက် တန်ဖိုးနည်း — နောက်ပိုင်း။

> **အကျိုးဆက်**: L2a §၅ ရဲ့ M4 ကို **M4a Adjust/Filters → M4b Transitions → M4c Effects → M4d Mask** အဖြစ်ခွဲ၊ M5 ကို **M5a Audio polish → M5b Speed/Reverse/Freeze** အဖြစ်ခွဲ။ သင်က အခြားအစဉ်ကို လိုချင်ရင် ဒီဇယားကို ပြင်ပြီး L5 ကို ညှိမယ်။

---

## ⏳ Open (သင့်အကြောင်းအရာ လိုအပ်)

| # | မေးခွန်း | Default (မဖြေရင်) | လိုအပ်တဲ့အချိန် |
|---|---|---|---|
| O1 | ကိုယ့်ကဗျာဖတ်သံ audio ၁–၂ မိနစ် + မှန်တဲ့စာသား (corpus + ASR benchmark) | ကျွန်တော့် synthetic နဲ့ပဲ စမ်း | S1 မတိုင်ခင်/M7 |
| O2 | Cloudflare Access AUD tag | `/api/*` public ဆက်ထား | M8 |
| O3 | သင့် Chrome စစ်စာရင်း (VERIFY §3) ဘယ်အချိန် စစ်ပေးနိုင်မလဲ | S8 မှာ | S8 |
| O4 | `public/v2/` ကို ပင်မလိပ်စာ (`/`) သို့ ပြောင်းမယ့်အချိန် | v1.0 (M1+M2) ပြီးမှ | Release |
