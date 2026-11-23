# Plan — Layer 2a: Vision နဲ့ CapCut-class Parity (L2 §၁ ကို အစားထိုး)

**ဦးတည်ချက် (သင်ဆုံးဖြတ်ထား)**: ForNyein က **CapCut လို အလုပ်လုပ်နိုင်တဲ့ web app** ဖြစ်မယ်။ ဒီဇိုင်း (UI၊ အတွင်းဖွဲ့စည်းပုံ၊ data model) အားလုံးကို **အစကတည်းက အဲဒီဘက်ကို ဦးတည်** ထားမယ်။
ဒီဖိုင်က L2 (`L2-product-requirements.md`) ရဲ့ **Persona/ရည်ရွယ်ချက်ကို အစားထိုး** တယ်။ L2 ထဲက "Poem Mode" က **ယေဘုယျ editor ပေါ်ကနေ ဆောက်တဲ့ အထူးပြု workflow (vertical)** အဖြစ်ပဲ ဆက်ရှိ — editor ရဲ့ data model ကို ကဗျာနဲ့ ကန့်သတ်မထား။
ဖြစ်စဉ်: ရှာဖွေချက် (CapCut feature စာရင်း — desktop/web/mobile guide များ) → parity matrix → "ကြိုတင်ဆုံးဖြတ်ရမယ့် ဖွဲ့စည်းပုံ" → milestone။

---

## ၁။ Vision

> **ForNyein = Browser ထဲမှာပဲ လုပ်ရတဲ့၊ မြန်မာစာကို အကောင်းဆုံးကိုင်တွယ်တဲ့၊ CapCut-class ဗီဒီယိုတည်းဖြတ်ကိရိယာ။**

**အခြေခံမူ ၆ ချက်**
1. **CapCut = လုပ်ဆောင်ပုံရဲ့ ကိုးကား**၊ UI/ရုပ်ရည်က ကိုယ်ပိုင် (VidPro နမူနာ) — CapCut ရဲ့ ပုံ၊ asset၊ နာမည်ကို မကူး။
2. **Parity ဆိုတာ ဟုတ်မှန်စွာ စစ်ပြီးမှ** ("CapCut လို ရှိတယ်" လို့ ပြောခွင့် = စစ်ဆေးမှုအထောက်အထားနဲ့)။
3. **အဆင့်ဆင့်**: Core NLE → စာ/စာတန်း → Transform/Keyframe → Effects/Transitions → အချိန်/အသံ → Template/Asset → AI → Polish။ အရင်အဆင့် မခိုင်ခင် နောက်အဆင့် မစ။
4. **Browser-only + Privacy**: ဒေတာ ကိုယ့်စက်ထဲမှာ၊ AI/ASR သုံးမှသာ အသံ/ပုံ ထွက်ပြီး ခွင့်ပြုချက်တောင်း။
5. **မြန်မာစာ = ကွဲပြားချက် (differentiator)**: Unicode မပျက်၊ Zawgyi ပြောင်း၊ font manager၊ syllable-aware animation၊ ကဗျာ Poem Mode။
6. **ဒီဇိုင်းကို ကြိုတင်ပြင်ဆင်**: နောက်မှထည့်မယ့် feature (keyframe, effect, transition, mask, speed) အတွက် **data model နဲ့ render pipeline ကို အခုကတည်းက ခွင့်ပေးထား** (§၄) — နောက်မှ project ဖိုင်ပုံစံ ထပ်ပြောင်းစရာ မလို။

**Non-goals (အခုအချိန်)**: mobile app၊ cloud/collaboration၊ account/login၊ 4K/HDR ပရော်ဖက်ရှင်နယ် color grading၊ ကူးခွင့်ရှိတဲ့ music library၊ social ကို တိုက်ရိုက်တင်ခြင်း၊ motion tracking (နောက်မှ)။

---

## ၂။ CapCut Feature Map → Parity Matrix

**ရှာဖွေချက်အခြေခံ**: CapCut desktop/web ရဲ့ ထင်ရှားတဲ့ ကိရိယာများ — multi-track timeline၊ keyframe animation (position/scale/opacity/rotation + graph editor)၊ mask၊ speed (ပုံမှန် + curve)၊ chroma key၊ AI background removal၊ stabilization၊ motion tracking၊ auto captions (ဘာသာစကားရွေး)၊ text-to-speech၊ text template/animation၊ sticker၊ stackable effects၊ filters၊ transitions၊ adjustment (brightness/contrast/color)၊ audio (volume/fade/noise reduction/voice isolation)၊ template၊ auto reframe၊ platform preset export (TikTok/Reels 1080×1920၊ YouTube 1080p)။ (ရင်းမြစ်: CapCut/TikTok help၊ အသုံးပြုလမ်းညွှန်များ၊ review များ)

**Priority**: **P0** = Core (မရှိရင် editor မဟုတ်) · **P1** = CapCut ပင်မအင်္ဂါရပ် · **P2** = ပြည့်စုံစေ · **P3** = ကြီးမားတဲ့ ကိစ္စ (နောက်မှ) · **✗** = မလုပ်ဘူး။ **Feasibility** = browser ထဲမှာ လုပ်နိုင်မှု (🟢 လွယ် · 🟡 ခက်/GPU · 🔴 ကြီး/model လို)။

### ၂.၁ Timeline / Editing
| CapCut အင်္ဂါရပ် | P | Feasibility | Milestone |
|---|---|---|---|
| Multi-track timeline၊ clip ရွှေ့/trim/split/delete/duplicate | P0 | 🟢 | M1 |
| Ripple / Magnetic main track / Snap / Multi-select / Marker / Zoom | P0 | 🟢 | M1 |
| Undo/Redo၊ Autosave | P0 | 🟢 | M1 ✅/🟡 |
| Track hide/lock/mute၊ ပြန်စီ၊ အမည်ပြောင်း | P0 | 🟢 | M1 |
| Linked clips (ဖတ်သံ↔စာတန်း)၊ Group | P1 | 🟢 | M1–M2 |
| Freeze frame / Reverse | P1 | 🟡 (reverse = decode ပြန်စီ) | M5 |
| Compound clip | P2 | 🟡 | M6+ |
| Proxy (ကြီးတဲ့ဗီဒီယို) | P1 | 🟡 | M8 |

### ၂.၂ Video / Image
| အင်္ဂါရပ် | P | Feas. | M |
|---|---|---|---|
| Transform (position/scale/rotate/flip/crop)၊ Opacity | P1 | 🟢→🟡 (GPU) | M3 |
| Fit/Fill/Canvas background (blur/color) | P1 | 🟡 | M3 |
| Overlay / Picture-in-picture | P1 | 🟢 | M3 |
| Blend/mix mode | P2 | 🟡 | M4 |
| Mask (shape + feather + invert) | P1 | 🟡 | M4 |
| Chroma key | P2 | 🟡 (shader) | M4 |
| Background removal (AI) | P3 | 🔴 (model) | M7 |
| Stabilization | P3 | 🔴 | M8+ |
| Motion tracking | ✗ (အခု) | 🔴 | — |
| Auto reframe | P3 | 🔴 | M7+ |

### ၂.၃ Keyframes / Animation
| Keyframe: position/scale/rotation/opacity/volume + easing (linear/ease/bezier) | P1 | 🟢 | M3 |
| Keyframe graph/curve editor | P2 | 🟢 | M3–M4 |
| Text/Sticker animation In/Out/Loop presets | P1 | 🟢 | M2 |

### ၂.၄ Text / Captions
| အင်္ဂါရပ် | P | Feas. | M |
|---|---|---|---|
| Text (font/color/stroke/shadow/align/spacing)၊ ကိုယ်ပိုင် font import | P0 | 🟢 | M1–M2 |
| Text template / style preset၊ Apply to all | P1 | 🟢 | M2 |
| Bubble / Text effect (glow, 3D…) | P2 | 🟡 | M2–M4 |
| Captions: SRT import/export၊ caption lane tools | P0 | 🟢 | M2 |
| **Auto captions (ASR)** | P2 | 🔴 (မြန်မာ model — benchmark) | M7 |
| Text-to-speech | P3 | 🔴 (မြန်မာအသံ?) | M7+ |
| **မြန်မာ Poem Mode** | P0 (ကွဲပြား) | 🟢 | M2 |

### ၂.၅ Stickers / Overlays
| Sticker/Shape/Logo/GIF overlay (ကိုယ်ပိုင် asset + R2 pack) | P1 | 🟢 | M6 |
| Animated sticker (Lottie/WebP/APNG) | P2 | 🟡 | M6 |

### ၂.၆ Effects / Filters / Transitions / Adjustment
| Adjustment (brightness/contrast/saturation/temperature/tint/highlights/shadows/vignette/sharpen/blur) | P1 | 🟡 GPU | M4 |
| Filters (LUT-ish + intensity) | P1 | 🟡 | M4 |
| Video effects (stackable: blur, glitch, shake, glow, grain…) | P1 | 🟡 | M4 |
| Transitions (fade/slide/zoom/wipe + duration) | P1 | 🟡 | M4 |
| LUT (.cube) import | P2 | 🟡 | M4+ |

### ၂.၇ Time / Speed
| Speed (constant) | P1 | 🟡 | M5 |
| Speed curve (ramp) | P2 | 🟡 | M5 |

### ၂.၈ Audio
| Volume / Fade / Mute / Solo / Detach audio | P0 | 🟢 | M1 |
| Record voiceover | P0 | 🟢 | M1 |
| EQ/Reverb/Echo/Compressor/Ducking/Limiter | P1 | 🟢 | M5 |
| Noise reduction (RNNoise WASM) | P2 | 🟡 | M5–M7 |
| Voice isolation / Voice changer | P3 | 🔴 | M7+ |
| Beat detect (auto marker) | P2 | 🟡 | M5 |
| Music/SFX library | P1 (ကိုယ့် R2) / ✗ (CapCut ရဲ့ copyright library) | 🟢 | M6 |

### ၂.၉ Templates / Export
| Project template၊ Text template | P1 | 🟢 | M6 |
| Script to Video | ✗ (အခု) | 🔴 | — |
| Export: resolution (720p/1080p)၊ fps (24/30/60)၊ preset (TikTok/Reels/YouTube/Shorts)၊ bitrate | P0 | 🟢 | M1–M2 (S2) |
| Export: ရှည်တဲ့ဗီဒီယို (stream)၊ audio-only၊ frame/cover | P1 | 🟡 | M8 |
| Cloud/Share ကိုတိုက်ရိုက် | ✗ | — | — |

### ၂.၁၀ Platform
Autosave ✓ · Fonts import ✓ · Shortcuts (CapCut နဲ့ ကိုက်အောင်) P1 · Dark/Light ✓ · Resizable panels P1 · Context menu (right-click) P1 · Onboarding/Tips P2 · Bilingual UI P2။

---

## ၃။ ကြိုတင်ဆုံးဖြတ်ရမယ့် ဖွဲ့စည်းပုံ ("ဒီဇိုင်းကို အစကတည်းက ဦးတည်")

အခုလက်ရှိ ကုဒ်က **စာ + အသံ + ပုံတစ်ပုံ** အတွက် ဆောက်ထားတာ။ CapCut-class ဖြစ်ဖို့ **Phase T မစခင်** အောက်ပါတွေကို ဖွဲ့စည်းပုံအဆင့်မှာ သတ်မှတ်ထားမှ နောက်မှ project ဖိုင်ပုံစံ/render ကို ထပ်ပြင်စရာ မလို။

### ၃.၁ Render pipeline: `buildFrame()` + Compositor
- **`buildFrame(project, t)`** = **pure function** (UI မပါ၊ test လုပ်လို့ရ) — အချိန် `t` မှာ မြင်ရမယ့် **layer စာရင်း** ထုတ်: `{source, srcTime, transform, opacity, blend, mask, fx[], transitionState}`။ Keyframe/speed/transition အားလုံးကို ဒီအဆင့်မှာ တွက်။
- **Compositor** (အပြင်ဘက်) = layer စာရင်းကို ဆွဲတဲ့ backend: **Canvas2D (အခု၊ fallback)** နဲ့ **WebGL2 (အဓိက)**၊ နောက်ပိုင်း WebGPU။ စာ (text) ကို Canvas2D နဲ့ rasterize ပြီး texture အဖြစ်သုံး (မြန်မာစာ shaping ကို browser ကိုပဲ ယုံ)။
- Preview နဲ့ Export က **တူညီတဲ့ `buildFrame` + Compositor** (Export က OffscreenCanvas/Worker)၊ **Golden frame test** နဲ့ ထိန်း။
- Effects/Transitions/Mask/Chroma key = **shader module** (`effects/*.glsl.js`) — registry ထဲ ထည့်ရုံ၊ core မပြင်။

### ၃.၂ Animatable property model (Keyframe အတွက် ကြိုတင်)
```
prop = number | { keys:[{ t, v, ease:'linear|hold|ease|bezier', c:[x1,y1,x2,y2] }] }      // t = clip-local စက္ကန့်
transform = { x:prop, y:prop, scale:prop, rot:prop, opacity:prop, anchor:{x,y}, flipX, flipY, crop:{l,t,r,b} }
evaluate(prop, tLocal) → number
```
- UI ရဲ့ slider/number တိုင်းမှာ **keyframe ◆ ခလုတ်** ထည့်နိုင်အောင် control ကို `<AnimProp>` လုပ်ထား။
- Text animation (In/Out/Loop) = preset ကနေ keyframe/parametric ထုတ်ပေးတာ (data-driven)။

### ၃.၃ Effect stack / Transition / Mask / Adjustment
```
clip.fx   = [{ id, type, enabled, params:{ name: prop } }]              // adjustment/filter/effect အားလုံး fx type
clip.mask = { shape:'rect|ellipse|path', feather:prop, invert, transform }
transition = { type, dur, ease }  —  clip.trIn / clip.trOut  (ကပ်နေတဲ့ clip နှစ်ခုကြား)
```
- Registry: `effects/registry.js` — `{type → {schema(UI), shader, defaults}}`။ Inspector အလိုအလျောက်ပုံဖော် (schema-driven UI)။

### ၃.၄ Time mapping (speed/reverse/freeze)
- `src {mediaId, in, out}` (ပြီးသား Plan §4.2) + `speed` (constant) + `speedCurve?` + `reverse`။
- **`srcTime(clip, t)`** တစ်ခုတည်းက video decode၊ audio scheduling၊ export အားလုံးမှာသုံး (B4 လို အမှားမကျ)။

### ၃.၅ Media pipeline
- **WebCodecs `VideoDecoder`** + **frame cache (LRU)**၊ audio decode + peaks၊ thumbnails (Worker)။ ကြီးတဲ့ဖိုင် → **OPFS** (IndexedDB blob ထက် ကောင်း)၊ project JSON = IndexedDB။
- **Proxy** (အနိမ့်ဖြေ) generation (M8)၊ relink (ဖိုင်ပျောက်ရင် ပြန်ချိတ်)၊ ref-count (မသုံးတော့တာ ရှင်း)။

### ၃.၆ Audio engine
- Web Audio graph per track + per clip fx၊ **Preview နဲ့ Offline export graph တူ** (Plan S6)၊ AudioWorklet (RNNoise/beat detect နောက်ပိုင်း)။

### ၃.၇ Worker architecture
- UI thread = ပြသခြင်း/input ပဲ။ **Decode / Peaks / Thumbnails / Export** = Worker။ Message protocol ကို `engine/rpc.js` မှာ စံသတ်မှတ်။

### ၃.၈ Command layer
- Edit အားလုံး `timeline.js` commands (`splitClip`, `setProp`, `addFx`…) → undo label၊ validation၊ shortcut၊ (နောက်ပိုင်း) macro/template apply။ **UI က project ကို တိုက်ရိုက်မပြင်ရ။**

### ၃.၉ Project schema v4 (S3 မှာ `src{in,out}` နဲ့ အတူ ကြိုတင်ဖော်ဆောင်)
```
project = { version:4, size, fps, tracks:[track], assets:{...}, markers:[], links:{} }
track   = { id, kind, name, hidden, locked, muted, solo, height, clips:[clip] }
clip    = { id, kind:'video|image|audio|text|sticker|shape|adjust', start, dur, src?, speed?, reverse?,
            transform, fx[], mask?, trIn?, trOut?, link?, ...kind ဆိုင်ရာ }
```
- `migrate()` v1→v3→v4။ v4 မှာ အသုံးမပြုသေးတဲ့ field (fx, mask, transform keys) ကို **ဗလာ/default** နဲ့ ကြိုထား — Phase M3/M4 မှာ UI ထည့်ရုံ။

---

## ၄။ UI / Design System (CapCut-class၊ ကိုယ်ပိုင်ရုပ်ရည်)

- **Layout** (ရှိပြီး): Rail → Panel → Player → Inspector → Timeline။ နောက်ထပ်: **Resizable splitters**၊ panel ချုံ့/ဖွင့်၊ layout မှတ်ထား၊ အနိမ့် ၁၂၈၀×၇၂၀။
- **Inspector tabs (clip အမျိုးအစားအလိုက်)** — CapCut ပုံစံ
  - Video/Image: **Basic** (transform/opacity/blend) · **Mask/Cutout** · **Animation** (keyframes/presets) · **Adjust** · **Speed** · **Audio**
  - Text: **Text** · **Animation** · **Style/Effects** · **Captions**
  - Audio: **Basic** (volume/fade) · **Effects** (EQ/reverb…) · **Speed**
  - Sticker/Shape: **Basic** · **Animation**
- **Control library**: Slider+Number ✓၊ Color+Eyedropper၊ **Curve/Bezier editor**၊ **Keyframe ◆ button**၊ Dropdown ✓၊ Toggle ✓၊ Segmented ✓၊ Asset card၊ Modal/Toast/Context menu၊ Tooltip(shortcut ပါ)။
- **Timeline visuals**: clip အမျိုးအစားအလိုက် အရောင် (Text ခရမ်း၊ Video ပုံသေ thumbnails၊ Audio အစိမ်း waveform) ✓၊ **Right-click menu** (Split/Delete/Ripple/Duplicate/Detach audio/Speed…)၊ drag from panel → drop indicator။
- **Shortcut**: CapCut နဲ့ ကိုက်အောင် (Space, Ctrl+B split, Delete, Ctrl+Z/Y, Q/W, ←/→ frame, +/-, N snap, P magnet) — `docs/shortcuts.md` မှာ စာရင်း။
- **Motion/Feedback**: ၁၅၀ ms transition၊ skeleton loading၊ empty state တစ်ခုချင်း CTA၊ error banner + Copy diagnostics။
- **မြန်မာစာအတွက်**: Font Manager (list/preview "မြန်မာစာ နမူနာ"/import/ဖျက်/favorite)၊ Zawgyi ထောက်လှမ်း banner၊ မြန်မာ tooltip။
- **မလုပ်ရ**: CapCut ရဲ့ logo/icon/asset/စာသား တိတိကျကျ မကူး၊ ကိုယ်ပိုင် icon/ဒီဇိုင်း ဆက်သုံး။

---

## ၅။ Parity Roadmap (Milestone)

| M | အမည် | ပါဝင်မယ့်အရာ | **ထွက်ပေါက်စံ (Exit criteria)** |
|---|---|---|---|
| M0 | Shell | UI layout/theme | ✅ 🟢 |
| **M1** | **Core NLE** | Phase S (stabilization) + Timeline v2 (T1–T6): multi-track edit၊ ripple/magnet/snap/multi-select/marker/link၊ အသံ/audio scheduling၊ **အသံပါ export** | Plan §6 S/T gate အားလုံး 🟢၊ ၅ မိနစ်ကဗျာ ချောမွေ့၊ `known-bugs` PASS |
| M2 | Text & Captions | text style/template/animation (In/Out/Loop)၊ SRT import/export၊ caption lane tools၊ **Poem Mode**၊ font manager၊ Zawgyi | မြန်မာ corpus ၁၀၀% မပျက်၊ ကဗျာ ၃ ပုဒ် e2e (record→export) |
| M3 | Transform & Keyframes | `buildFrame`+WebGL2 compositor v1၊ video/image clip transform/crop/opacity/fit/canvas bg၊ **keyframes UI**၊ overlay/PiP | golden frame ၂၀ ခု၊ keyframe preview=export |
| M4 | Visual FX | adjustment/filters/effects stack/transitions/mask/blend/chroma key | effect ၁၅+ ခု shader၊ transition ၈ ခု၊ GPU မရတဲ့စက် fallback |
| M5 | Time & Audio tools | speed/reverse/freeze/curve၊ audio fx (EQ/reverb/…)၊ noise reduction၊ beat markers၊ voiceover | A/V drift ≤ 40 ms (speed ပါ)၊ preview=export spectrum |
| M6 | Templates & Assets | project/text template၊ sticker/shape/logo pack၊ R2 library UI၊ stickers animated | template ၅ ခု၊ asset import/relink |
| M7 | AI / Smart | **Auto captions (benchmark အောင်မှ)**၊ background removal (WASM, optional download)၊ auto reframe၊ (TTS မြန်မာအသံ ရှိမှ) | model မှန်/ခွင့်ပြုချက်/size ကိစ္စ ဆုံးဖြတ်ပြီး |
| M8 | Pro polish | proxy/OPFS/large project၊ a11y၊ localization၊ onboarding၊ docs၊ **Access ဖွင့်** | Release gate (Plan §1) အားလုံး |

> M1 မပြီးမချင်း M2+ မစ (Phase S ပါ M1 ထဲ)။ M3–M5 ကို အစဉ်လိုက်၊ M2 နဲ့ M5 ရဲ့ အချို့ကို ကဗျာအသုံးတည့်ရာ (Poem) အရင်ဆွဲတင်ရင် သင်ဆုံးဖြတ်။

---

## ၆။ CapCut-class ရည်မှန်းချက်ရဲ့ အန္တရာယ်

| အန္တရာယ် | ကာကွယ်ရေး |
|---|---|
| Scope ကြီးလွန်း | Milestone gate၊ P0/P1/P2 စည်းကမ်း၊ "parity" = ကိုယ်ရွေးတဲ့ must-have ပဲ |
| GPU compositor ရှုပ်/browser ကွဲ | Canvas2D fallback၊ golden frame test၊ WebGL မရရင် feature ကိုပိတ်ပြီး အသိပေး |
| ကြီးတဲ့ဗီဒီယို ၄K | ၁၀၈၀p အကြံပြု limit၊ proxy (M8)၊ OPFS |
| AI model (အရွယ်/လိုင်စင်/privacy) | optional download၊ ကိုယ့်စက်မှာ run (WASM/WebGPU)၊ ခွင့်ပြုချက်၊ benchmark အရင် |
| ဥပဒေ/လိုင်စင် | CapCut asset/UI မကူး၊ music/sticker/font လိုင်စင်စစ်၊ font = private R2 |
| ကုဒ်ပမာဏ ကြီးလာ → အမှားတိုး | Command layer၊ pure `buildFrame`၊ ကုဒ်ပုံစံ စည်းမျဉ်း၊ CI၊ verification discipline |

---

## ၇။ ဆုံးဖြတ်ရန် (Decisions — default အကြံ ပါ)

| # | ဆုံးဖြတ်ချက် | Default |
|---|---|---|
| D1 | Render backend: WebGL2 ကို အဓိက (Canvas2D fallback)၊ WebGPU နောက်မှ | ✅ အတည်ပြုရန် |
| D2 | Media သိမ်း = OPFS (ကြီးတဲ့ဖိုင်)၊ project JSON = IndexedDB | ✅ |
| D3 | Animatable property model + `src{in,out}` + `fx/mask` field တွေကို **schema v4 မှာ S3 နဲ့အတူ ကြိုထား** | ✅ (Phase T မစခင်) |
| D4 | UI framework = Preact+htm ဆက်သုံး | ✅ |
| D5 | **P1 ထဲက သင့်အတွက် မဖြစ်မနေ ဘာတွေလဲ** (Keyframes? Transitions? Speed? Stickers? Auto captions?) | သင်ရွေး → M3–M7 အစီအစဉ် ပြန်စီ |
| D6 | Input ကန့်သတ်: ၁၀၈၀p၊ ≤ ၁၀ မိနစ် (အစ) | ✅ |
| D7 | Shortcut ကို CapCut default နဲ့ ကိုက်အောင် | ✅ |
