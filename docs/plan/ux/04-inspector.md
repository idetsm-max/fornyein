# UX Spec · Part 4 — Inspector (Details panel)

**ပြဿနာ (G1, G9)**: Inspector tab ("Text/Animation/Timing") က clip အမျိုးအစားနဲ့ မကိုက် (Audio clip မှာတောင်)၊ keyframe ◆ မရှိ၊ Project settings မရှိ။ **စံ**: ရွေးထားတာအလိုက် tab/control အပြည့်အစုံ (CapCut Details panel လို)၊ control အားလုံး **အပြုအမူတူ**။
သင်္ကေတ: ✅ = လက်ရှိ ရှိပြီး · ◆ = keyframable (M3) · M# = milestone။

---

## ၄.၁ Anatomy + Registry

```
┌─ INSPECTOR ───────────────────────┐
│ [icon] Clip name (dbl-click=rename)  [⋯] │  ← header
│        Text · 00:03:00 · Track: Text      │
│ Basic · Animation · Effects · Captions    │  ← tabs (kind အလိုက်)
│ ▾ Text                                    │  ← section (collapsible)
│   [textarea........................ 14/500]│
│ ▾ Font & Style                            │
│   Font    [Noto Sans Myanmar        ▾] ↺  │
│   Size    ──●────────────── [ 72 ] px ↺ ◆ │  ← control row: label | control | value | ↺ reset | ◆ key
│ ▸ Stroke                                  │
└───────────────────────────────────────────┘
```
- **Header**: icon+kind·**clip name** (double-click rename)·အချိန်အတို (start·dur)·**⋯ menu**: *Reset all · Copy style · Paste style · Save as preset… · Select in timeline*။
- **Inspector registry** (`inspector/registry.js`): `kind → [tab → [section → [control schema]]]` — control schema = `{ path, type, label, tip(MY), min, max, step, unit, default, keyframable, milestone, visibleWhen }`။ UI ကို schema ကနေ ပုံဖော် (feature အသစ်ထည့်တာ core မပြင်)။
- **Tabs state**: ရွေးထားတဲ့ clip kind ပြောင်းရင် **အရင် tab နာမည်တူရင် မှတ်ထား** မဟုတ်ရင် ပထမ tab။ Section collapse state ကို kind+tab အလိုက် မှတ်။
- **Scroll**: Inspector scroll (အနည်းဆုံး scrollbar ပါး)၊ tab bar sticky။

---

## ၄.၂ Control စံ (Control library)

| Control | အပြုအမူ |
|---|---|
| **Number field** | click = အကုန်ရွေး · **label ကိုဆွဲ = scrub** (cursor ↔၊ `Shift` ×၁၀၊ `Alt` ×၀.၁) · `↑/↓` step (Shift ×၁၀) · **Enter commit / Esc ပြန်** · Tab ဆက် · unit ပါ ("px/°/%/s/dB") · invalid → clamp + အနီ flash ၃၀၀ ms · အလွတ် = မပြောင်း |
| **Slider** | track click = jump · drag · ←/→ step · **thumb double-click = default** · ဆွဲနေစဉ် value tooltip · ညာဘက် number field ကပ် |
| **Color** | swatch → **popover**: SV square + hue + alpha · **hex** input (`#RRGGBB(AA)`) · **Eyedropper** (`EyeDropper` API၊ မပံ့ပိုးရင် ဝှက်) · **Recent ၈** (သိမ်း) · **Project palette** (project ထဲသုံးထားတဲ့အရောင်) · preset grid · Esc ပိတ် · ဆွဲနေစဉ် live၊ ပိတ်ချိန် = ၁ undo |
| **Gradient** (text fill) | stop ၂–၃၊ angle၊ stop click ဖြင့် အရောင်ပြင် |
| **Font select** | **search** + အုပ်စု (*Project fonts · R2 Fonts · မြန်မာ system · အခြား*) · **option တိုင်းကို ကိုယ့်ဖောင့်နဲ့ "မြန်မာစာ Abc" ပြ** · ★ favorite · အောက်ဆုံး "**Import font…**" · **မရှိတဲ့ font** ⚠ ဝါ + fallback သတိ · ↑/↓ preview (Enter ရွေး) |
| **Switch** | on/off၊ Space toggle၊ label ကိုနှိပ်လို့ရ |
| **Segmented** | icon/စာ ရွေးချယ်ချက်၊ ←/→ |
| **Dropdown** | native မဟုတ်၊ custom (focus ring၊ typeahead) |
| **Textarea** | auto-grow (အမြင့် ၆၀–၂၀၀)၊ counter `n/500`၊ **IME composition မပြတ်** (P12) |
| **↺ Reset** | default ပြန် (animated ဖြစ်နေရင် keys ရှင်း — confirm မလို၊ undo ရ) |
| **◆ Keyframe** (M3) | §၄.၃ |
| **Section header** | ▾/▸ collapse၊ ညာမှာ section-reset ↺ |

**Undo coalescing**: key = `{path}:{clipIds}`၊ ဆက်တိုက် ≤ ၉၀၀ ms (slider/scrub/typing) = ၁ ဆင့်၊ pointerup/Enter/blur မှာ ပိတ်။ **Label** = "Change {label}" ("Change Size")။

---

## ၄.၃ Keyframe ◆ (M3)

| State | icon | အဓိပ္ပာယ် |
|---|---|---|
| none | ◇ ခေါင်း (မီးခိုး) | animated မဟုတ် |
| animated (playhead မှာ key မရှိ) | ◇ (accent) | key ရှိ၊ ဒီအချိန်မှာမရှိ |
| key at playhead | ◆ (အဝါ `--keyframe`) | ဒီအချိန်မှာ key ရှိ |
- **Click** = key ထည့်/ဖယ် (playhead မှာ)။ ပထမ key ထည့်တာနဲ့ **auto-key**: ထိုနောက် တန်ဖိုးပြောင်းတိုင်း playhead မှာ key အလိုအလျောက်။
- animated ဖြစ်နေရင် label ဘေးမှာ **◀ ▶** (နောက်/ရှေ့ key သို့ jump)။
- **Right-click ◆**: *Easing* (Linear · Ease · Hold · Bezier…) · *Delete key* · *Copy/Paste key*။
- **Clip header ◆** = Transform ချိတ်ဆက် properties (X,Y,Scale,Rotate,Opacity) ကို တစ်ခါတည်း key။
- Timeline မှာ clip အောက် **keyframe row** (expand) — ◆ အမှတ်ဆွဲရွှေ့/ဖျက်၊ အပြည့်အစုံ Part 5။ **Curve editor** = Inspector ထဲက "Graph" ခလုတ်က popover (M3–M4)။
- Player/Inspector နှစ်ဘက်လုံးမှာ ဆွဲတာ keyframe အလုပ်ဖြစ်။

---

## ၄.၄ Multi-select / Mixed / Apply-to-all / Copy style

- **Multi-select**: တူတဲ့ tab/control ပဲပြ (kind မတူရင် အကျဉ်းချုပ် "ကွဲပြားတဲ့ clip ၃ ခု" + common = Transform/Opacity/Timing)။ တန်ဖိုးမတူရင် field မှာ **"Mixed"** (placeholder)၊ color = အကွက်ကို မျဉ်းဖြတ်၊ ပြောင်းရင် **အားလုံးကို သက်ရောက်**၊ undo ၁ ဆင့်။
- **Apply to all** (Text Basic/Animation ထဲ ခလုတ် ▾): *This clip · Selected · All text clips · All captions · Same track* — **style/animation ကိုပဲ** (စာသား/အချိန်/နေရာ **မထိ**)။
- **Copy style / Paste style** (`Ctrl+Alt+C` / `Ctrl+Alt+V` + header ⋯): style attributes (font, color, stroke, shadow, size, anim) ကို ကူး/ကပ် — clip အမျိုးအစားတူ။
- **Save as preset…**: style ကို နာမည်ပေးသိမ်း (project + local library) — Text tab ထဲ "Presets" row မှာ ပေါ်၊ **Export/Import preset (.json)**။

---

## ၄.၅ Tab × Control စာရင်း (Registry ရဲ့ ပင်မ)

### TEXT clip
**Basic**
| Section | Control | Range / Default / Unit | ◆ | ✅/M |
|---|---|---|---|---|
| Text | Content (textarea) | ≤ 500 | – | ✅ |
| Font & Style | **Font** | list | – | ✅ |
| | **B / I / U** | toggle | – | ✅ |
| | **Align** L/C/R/Justify | | – | ✅(L/C/R) |
| | **Size** | 8–240 · 72 · px (@1080p height) | – | ✅ |
| | Letter spacing | −20…100 · 0 | – | M2 |
| | Line height | 0.8–3.0 · 1.5 | – | M2 |
| Color | **Fill** | colour · #fff | ◆ | ✅ |
| | **Fill 2 / Gradient** (အရှေ့စာ/နောက်စာ အရောင်နှစ်မျိုး + k) | | – | ✅ |
| Stroke | toggle · colour · **width** | 0–40 · 14% of size | – | ✅ (width M2) |
| Shadow | toggle · colour · blur · offset X/Y · opacity | | – | ✅ (params M2) |
| Glow | toggle · colour · radius | | – | ✅ |
| **Background box** | toggle · colour · opacity · padding · radius | | – | M2 |
| Transform | **Position X/Y** (px) · **Scale** (10–400% · 100) · **Rotate** (−180…180°) | | ◆ | ✅(X,Y,Rot) Scale M3 |
| | **Wrap width** (Auto / px) | | – | M2 |
| | **Opacity** | 0–100% · 100 | ◆ | ✅ |
| Timing | **Start · Duration · End** (s) | ≥0 · 3 · | – | ✅ |
**Animation**: *In* (preset list + duration 0.1–3 s) · *Out* · *Loop* (Float · Pulse · Shake · Wave · Flicker · None) · **Reveal** (Typewriter · Word reveal — **syllable-aware**) ✅ · easing · ▶ Preview · **Apply to all captions** (M2)။
**Effects/Style** (M2 — v1 effect ၁၅ ခု): Outline strength · Long shadow · Neon · Gradient · Gold/metal · Emboss · Shimmer · Glitch · Float · Pulse · Flicker · Shake · Wave — တစ်ခုချင်း **toggle + intensity** (မြန်မာမှာ စမ်းပြီးတာကိုပဲ default ဖွင့်ခွင့်၊ စမ်းမပြီးတာ ⚠ badge)။
**Captions** (caption clip ကိုပဲပြ): **Status chip** (Draft/Review/Locked) · **Confidence meter** (အနီ/ဝါ/စိမ်း + %) · Source (manual/auto-draft/imported) · ခလုတ်: *Mark reviewed · Lock/Unlock · Snap to voice · Re-time this line · Split at playhead · Merge next · Shift ±0.1 s*။

### VIDEO / IMAGE clip
| Tab | Controls |
|---|---|
| **Video (Basic)** M3 | **Transform**: X·Y·Scale (uniform 🔗 lock)·Scale X/Y·Rotate·**Flip H/V** ◆ · **Crop** (L/T/R/B + ratio preset + [Crop ⛶]) · **Fit**: Fit/Fill/Original · **Opacity** ◆ · **Blend mode** (Normal·Multiply·Screen·Overlay…; M4d) · **Timing**: Start·Duration + **Source In/Out** (read-only + Slip ရန် drag) · Stabilize (P3) |
| **Mask** M4d | Shape (None·Line·Mirror·Circle·Rect·Heart·Star·Custom path) · Position·Size·Rotate · **Feather** · **Invert** ◆ · **Chroma key** (eyedropper ရွေး·intensity·shadow; P2) |
| **Animation** M3 | **In/Out/Combo** preset (Fade·Slide·Zoom·Spin·Shake…) + duration · **Loop** · **Keyframes list** |
| **Adjust** M4a | Filter (လက်ရှိ + intensity) · **Basic**: Brightness·Contrast·Saturation·Temperature·Tint·Highlights·Shadows·Fade · **Color**: HSL ၈ ဖြာ · **Effects**: Sharpen·Vignette·Grain · LUT import (P2) · ↺ · Save as preset |
| **Speed** M5b | **Constant** 0.1–10× (default 1) · Duration (derived) · **Reverse** · **Freeze frame** (action) · Curve editor (P2) |
| **Audio** M1/M5 | Volume · Fade in/out · Mute · **Detach audio** (ခလုတ်) · Noise reduction (M5a) |

### AUDIO clip
| Tab | Controls |
|---|---|
| **Basic** | **Role** (Voice/Music/SFX) · **Volume** (0–200% · 100%၊ dB ကိုပါပြ) · **Fade in/out** (0–10 s) · **Pan** (−100…100) · **Mute** · **Loop** (Music) · **Ducking** (Music မှာ: toggle · amount −12 dB · attack 0.1 s · release 0.4 s — "Voice clip အောက်မှာ ချ") · Timing (Start/Dur + Source In/Out) |
| **Effects** M5 | **EQ** Low/Mid/High (−12…+12 dB) · **Compressor** amount · **Reverb** (mix·size preset) · **Echo** (mix·time) · **Noise reduction** (M5a) · **Normalize/Loudness** ("−16 LUFS သို့ ညှိ" ခလုတ်၊ M5a) · Voice effects (P3) |
| **Speed** M5b | 0.5–2× · Keep pitch toggle · Reverse |
- Preview **meter** (clip level) inspector ထိပ်မှာ။ ✅ ရှိပြီး: Track volume/pan/ducking/gain/volume/pan/EQ… (လက်ရှိ "Audio clip settings" ကို tab အဖြစ် ခွဲ)။

### STICKER / SHAPE
**Basic**: Transform (X·Y·Scale·Rotate·Flip)·Opacity·(Shape) **Fill/Stroke/Corner radius**·Timing · **Animation**: In/Out/Loop။

### EFFECT / FILTER / ADJUSTMENT clip (layer clips)
**Parameters** (effect schema အတိုင်း)·**Intensity** ◆·**Applies to** (အောက်က track အားလုံး/ရွေးထားတဲ့ track)·Timing။

### TRANSITION (Timeline ပေါ်က transition ကိုရွေးရင်)
Type·**Duration** (0.1–3 s · 0.5)·Direction (ရှိရင်)·Alignment (Center/Start/End)·**Apply to all boundaries** ခလုတ်။

### MARKER · TRACK
Marker: Label·Colour·Time။ Track (header ကို နှိပ်ရင်): Name·Height(S/M/L)·Mute·Solo·Lock·Hide·(Video main) Magnet။

### NONE (ဘာမှမရွေး) → **Project settings**
**Canvas**: Ratio·Custom W×H·**FPS** (24/25/30/50/60)·**Background** (Colour/Blur-fill/Image)·Safe-area default · **Captions defaults**: default style preset·default duration · **Audio**: master volume (preview)·(P2) loudness target · **Info**: Duration·clip count·media size·"Clear caches"။

---

## ၄.၆ Disabled / Visibility စည်းမျဉ်း
- **မသက်ဆိုင်တဲ့ control ကို ဖျောက်** (disabled မလုပ်) — **သက်ဆိုင်ပေမဲ့ အခြေအနေကြောင့်မရ** = disabled + **tooltip အကြောင်းရင်း** (ဥပမာ Ducking: "Voice clip မရှိလို့")။
- **Locked track** clip = Inspector read-only (banner "ထရက် လော့ခ်ထားတယ် [Unlock]")။
- **မပြည့်စုံသေးတဲ့ control** (milestone မရောက်သေး) = မပြ (အလွတ် tab မရှိရ)။

---

## ၄.၇ Acceptance (Part 4)

| ID | စစ်ချက် |
|---|---|
| **UX-INS-01** | Clip kind ၆ မျိုး (text/video/image/audio/sticker/effect) ရွေးတိုင်း **tab စာရင် §၄.၅ နဲ့ ကိုက်** (Audio မှာ "Text/Animation/Timing" မပေါ်) |
| UX-INS-02 | None = Project settings ပေါ်၊ field ပြောင်း → project ပြောင်း၊ undo |
| UX-INS-03 | Number field: label scrub / ↑↓ / Shift·Alt / Enter·Esc / clamp flash |
| UX-INS-04 | Slider thumb double-click=default၊ drag = undo ၁ ဆင့်၊ value tooltip |
| UX-INS-05 | Color popover: hex/alpha/eyedropper/recent/project palette၊ ၁ undo |
| UX-INS-06 | Font select: search/group/preview/★/Import/missing ⚠ |
| UX-INS-07 | ↺ reset (control/section/all)၊ undo ပြန်ရ |
| UX-INS-08 | Multi-select Mixed (field/color)၊ ပြောင်း = အားလုံး၊ ၁ undo |
| UX-INS-09 | Apply to all (scope ၅ မျိုး) စာသား/အချိန်/နေရာ မထိ |
| UX-INS-10 | Copy/Paste style (Ctrl+Alt+C/V) · Save preset · Export/Import preset |
| UX-INS-11 | Keyframe ◆ states ၃ မျိုး၊ auto-key၊ ◀▶ jump၊ right-click easing (M3) |
| UX-INS-12 | Locked track read-only banner၊ Disabled tooltip အကြောင်းရင်း |
| UX-INS-13 | Text tab: **အရောင်နှစ်မျိုး (Fill2/k)၊ Stroke on/off၊ Reveal (syllable-aware)** — မြန်မာစာ မပျက် (corpus) |
| UX-INS-14 | Audio Basic: Ducking (voice မရှိရင် disabled+tooltip)၊ Fade/Pan/Role |
| UX-INS-15 | Inspector registry — schema တစ်ခုထည့်ရုံနဲ့ control ပေါ် (unit) |
