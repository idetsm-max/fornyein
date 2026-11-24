# ForNyein — Master Plan v5 (CapCut-like · ပြန်လည်ရေးသားထားသော စာတမ်း)

> **ForNyein = CapCut လို အလုပ်လုပ်ပြီး၊ CapCut လို ခံစားရတဲ့ (UX)၊ Browser ထဲမှာပဲ သုံးရတဲ့၊ မြန်မာစာကို အကောင်းဆုံးကိုင်တွယ်တဲ့ ဗီဒီယိုတည်းဖြတ်ကိရိယာ။**

ဒီ v5 က Plan ကို **အစကနေ CapCut ဦးတည်ပြီး ပြန်ရေး** ထားတာပါ။ ပြင်ဆင်ချက်: (၁) **UI/UX ကို Plan ရဲ့ ဗဟိုအပိုင်း** (§၃) အဖြစ် ထည့် — CapCut-like interaction တစ်ခုချင်းကို သတ်မှတ်၊ (၂) လက်ရှိ UI ကို **တကယ်စမ်းပြီး audit** လုပ်ထားတဲ့ ရလဒ် (§၂)၊ (၃) Milestone တိုင်းမှာ **engine + UX အလုပ်** နှစ်ခုလုံး ပါ (§၆)၊ (၄) အရင်စာတမ်းတွေကို ပေါင်းစည်းပြီး ရှင်းလင်းအောင် ဖွဲ့စည်းထားတယ်။
**ကိုးကားထားတဲ့ အသေးစိတ်**: `docs/plan/INDEX.md` · `docs/plan/DECISIONS.md` (ဆုံးဖြတ်ချက်) · `docs/plan/L2a-…` (CapCut parity matrix) · `docs/plan/L2-…` (Poem Mode၊ FR/NFR) · `docs/plan/L3-m1-breakdown.md` (M1 လုပ်ငန်းခွဲ) · `docs/VERIFY.md` (စစ်ဆေးမှု)။ ဒီဖိုင်နဲ့ ကွဲလွဲရင် **ဒီဖိုင် (နဲ့ DECISIONS.md)** ကို အရင်ယုံ။

**Session အသစ် (လူ/AI) တိုင်း**: ဒီဖိုင် → `DECISIONS.md` → `VERIFY.md` ကို အရင်ဖတ်ပြီးမှ ဆက်လုပ်ပါ။

---

## ၁။ ဦးတည်ချက်နဲ့ မူများ

**ဘာကို ဆောက်နေတာလဲ**: CapCut desktop လို multi-track video editor — web app တစ်ခု။ **ကွဲပြားချက် = မြန်မာစာ** (Unicode မပျက်၊ Zawgyi ပြောင်း၊ font manager၊ ကဗျာ Poem Mode)။ အသုံးပြုသူ (assumption): Facebook Reels/TikTok/YouTube မှာ တင်မယ့် မြန်မာ short-video/ကဗျာ ဖန်တီးသူ၊ Windows Chrome/Edge။

**မူ ၈ ချက်**
1. **CapCut = လုပ်ဆောင်ပုံ + ခံစားမှု (UX) ရဲ့ ကိုးကား**၊ **ရုပ်ရည်/icon/asset/စာသား = ကိုယ်ပိုင်** (VidPro နမူနာ)။ CapCut ကို မကူး။
2. **ရွေးတာ → Inspector ပြောင်း** (selection-driven)၊ **ဆွဲ/ချ/click/right-click/shortcut** ကို CapCut လိုမျိုးပဲ။
3. **Non-destructive**: ဖိုင်မူရင်းကို မထိ၊ clip တိုင်း `src{in,out}`၊ **Undo ၁၀၀%**၊ autosave။
4. **Preview = Export** (renderer/audio graph တစ်ခုတည်း)။
5. **မြန်မာစာ မပြောင်းမလဲ** (အသုံးပြုသူ confirm မပါဘဲ စာသား မပြောင်း)။
6. **အဆင့်ဆင့်၊ စစ်မှ ✅**: အထောက်အထားမပါရင် "ပြီး" မရေး။
7. **Browser-only + privacy**: ဒေတာ ကိုယ့်စက်ထဲ၊ AI/ASR သုံးမှ ခွင့်ပြုချက်တောင်း။
8. **အစကတည်းက ကြိုတင်ဖွဲ့စည်း** (keyframe/effect/transition/mask/speed အတွက် model နဲ့ pipeline) — နောက်မှ ပုံစံပြောင်းစရာ မလို။

**Non-goals**: mobile app၊ cloud/collab၊ account/login၊ 4K/HDR pro grading၊ ကူးခွင့်ရှိတဲ့ music library၊ social share၊ motion tracking။

---

## ၂။ လက်ရှိအခြေအနေ (အထောက်အထားအခြေခံ)

**Status စကားလုံး**: 🟡 ကုဒ်ရေးပြီး (မစစ်) · 🟢 **စစ်ပြီး** (အထောက်အထားနဲ့) · 🔴 အမှားတွေ့ · ⏸ ရပ်ထား · ⬜ မစရသေး။

### ၂.၁ လုပ်ဆောင်ချက် စစ်ဆေးမှု (`docs/VERIFY.md`)
| အပိုင်း | | မှတ်ချက် |
|---|---|---|
| Shell/theme၊ Engine core (store/undo/autosave/render) | 🟢 | unit + e2e ၁၄ pass |
| Media import → audio clip၊ Text presets၊ **Auto-draft** (±၀.၀၂ s)၊ SRT | 🟢 | |
| Timeline ops (text split+undo, ripple, lock, trim limit) | 🟡 | **B4/B7 ပြင်ပြီး** (schema v4 `src`၊ lanes) — unit + known-bugs ✅၊ သင့် Chrome mouse gesture မစစ်ရသေး |
| **မြန်မာ Unicode စာ** | 🟢 | **B1 ပြင်ပြီး** (`feat/stabilization-s1-s2`) — `normalizeMyanmar` ဖျက်၊ Zawgyi = confirm ပဲ။ Evidence: known-bugs B1 (၇ check) + unit + e2e |
| **Export အသံပါ** | 🟡 | **B2/B3/B8 ပြင်ပြီး** — ffprobe: MP4 H.264+Opus 6.0135 s (drift 13.5 ms)၊ WebM VP9+Opus။ **နားနဲ့/VLC/သင့် Chrome မစစ်ရသေး** |
| Audio Preview | 🟡 | **S4/B5 ပြင်ပြီး** — AudioContext clock ပေါ် buffer scheduling (playhead rAF)၊ drift > 0.12 s မှသာ reschedule၊ e2e: 0 media-element seek။ **နားဖြင့်မစစ်ရသေး** |
| Preview=Export အသံ | 🟢 | **S6/B6 ပြင်ပြီး** — preview/export နှစ်ခုလုံး `audio-graph.js` တစ်ခုတည်း၊ **e2e `mixdown.js` ၉ ခု ဖြင့် အတိုင်းအတာ စစ်ပြီး** (volume ×0.5 → 0.500၊ mute → 0၊ pan −1 → ညာ 0၊ clip gain ×2 → 0.3916)။ ဒီစစ်က clip FX chain bypass ကို ဖော်ထုတ်ပြီး ပြင်ခဲ့တယ် |
| **Clip Filters (EQ/high-pass/gate/comp/echo/reverb)** | 🟢 | e2e `mixdown.js` — offline render မှာ တိုင်းတာ (high-pass → 0.0097၊ EQ +12 → 0.3098၊ bypass → 0.1958၊ gate → 0၊ echo tail → 0.0685) |
| အသံ အစစ်ကြားရ၊ mouse gesture၊ mic record၊ R2 Library/Fonts၊ Video/Overlay | ⬜ မစစ်ရသေး | သင့် Chrome မှာ |
| Auto caption (Workers AI Whisper) | 🔴/⏸ | မြန်မာမှာ တခြားစာလုံးထွက် — M7 benchmark |
| Cloudflare Access | ⏸ | `/api/*` public |
| **S7 CI/lint** | 🟢 | `scripts/lint-lines.mjs` ratchet ✅; `.github/workflows/test.yml` (unit/lint/syntax/e2e) ကို token `workflow` scope မရှိ၍ repo မတင်၊ local သာ |
| **S8 stabilization** | 🟢 | `scripts/test-all.sh` gate (lint+unit+known-bugs+e2e)၊ CI e2e job (Chromium + puppeteer-core) |
| **U1–U3 (G1–G3)** | 🟢 | Inspector registry၊ context menu/clipboard၊ drag & drop — headless e2e `tests/e2e/ux.js` ✅ |
| **U4–U6** | 🟢 | Splitters/collapse (localStorage)၊ track mute/solo/rename/height၊ razor/fit/Q/W — e2e `tests/e2e/layout.js` ✅ |
| **T1 command layer** | 🟢 | `engine/timeline.js` + undo labels (`history.js`)၊ unit ၁၃ + property checks |
| **T3 groups/markers** | 🟢 | link/unlink + group move/delete၊ markers (M / ↑↓ / right-click)၊ marquee select၊ Alt+→ — e2e `groups.js` |
| **T2 gestures** | 🟡 | Shift = ripple trim၊ Alt = roll (edge) / slip (body)၊ Ctrl = slide၊ N = snap၊ box select ✅ (`ui/marquee.js`၊ e2e groups) — သင့် Chrome mouse စစ်ရန် ကျန် |
| **E1 export** | 🟢 | dialog: range (I/O) + captions burn-in/SRT sidecar (`engine/export-range.js`) |
| **T6 captions** | 🟢 | SRT import → caption clips (`engine/captions.js`)၊ timeline မှာ dashed outline၊ SRT export ရှိပြီး |
| **T5 perf** | 🟢 | viewport virtualization (`engine/virtual.js`) + waveform LOD (bars by width) + horizontal scroll |
| **Global behaviours (UX §၁.၈)** | 🟢 | focus mode (Shift+Tab)၊ window title ●၊ hide/unload အတင်းသိမ်း၊ crash recovery၊ multi-tab read-only (`engine/session.js`) — e2e `session.js` ၁၃ |
| **T4 transport** | 🟢 | ←/→၊ Home/End၊ J/K/L၊ I/O + loop၊ fit၊ scrub (edge/marker snap + audio burst) |

### ၂.၂ UI/UX audit (လက်ရှိ UI ကို headless Chromium မှာ တကယ်နှိပ်စမ်းပြီး တွေ့တာ — Nov 2026)
**ရှိပြီး ✅**: VidPro layout (rail/panel/player/inspector/timeline/status)၊ dark/light၊ undo/redo၊ Text panel (Add text/presets/Poem)၊ Inspector (text: font/style/color/stroke/size/opacity/position/rotate…)၊ Player ပေါ်မှာ ရွေးထားတဲ့စာ ဆွဲ + handle ၈ ခု၊ Timeline ဆွဲ/trim/split/snap/zoom၊ Export dialog၊ shortcut ခလုတ်၊ ၁၁၀၀×၆၅၀ မှာ page scroll မရှိ။
**CapCut နဲ့ ကွာတာ (GAP)**
| # | GAP | သက်ရောက်မှု |
|---|---|---|
| G1 ✅ **ပိတ်ပြီး** (kind→tabs registry) — မူလ: **Inspector tab တွေက clip အမျိုးအစားနဲ့ မကိုက်** — Audio clip ရွေးတာတောင် "Text / Animation / Timing" tab ပြ | selection-driven မဟုတ်၊ အသုံးပြုသူ ရှုပ် |
| G2 | **Right-click context menu မရှိ** | CapCut သုံးသူ အကျင့်နဲ့ မကိုက် |
| G3 | **Media tile ကို Timeline ပေါ်ဆွဲချလို့မရ** (`draggable` မရှိ၊ click ပဲ) | CapCut ရဲ့ အဓိကအလုပ်လုပ်ပုံ ပျက် |
| G4 | **Rail tool ၈ ခုက panel အလွတ်** (Audio, Stickers, Effects, Transitions, Filters, Adjust, Templates, More) — Media/Text ပဲ အလုပ်လုပ် | ခလုတ်နှိပ်ရင် ဘာမှမရှိ |
| G5 | **ညာဘက်အောက်က Effects/Transitions/Filters panel က demo** (tile နှိပ်လည်း clip မပြောင်း) | ထင်ရှားတဲ့ လှည့်စားမှု |
| G6 | **Panel resize/collapse (splitter) မရှိ** | laptop မျက်နှာပြင်ငယ်မှာ ကျဉ်း |
| G7 | **Track header** က hide/lock ပဲ — mute/solo/rename/height/reorder မရှိ | |
| G8 | **Timeline toolbar** မှာ Razor၊ Magnet (main track)၊ Link၊ Marker၊ In/Out၊ Delete-left/right မရှိ | |
| G9 | **Keyframe ◆** မရှိ၊ **Player handle** က scale/rotate/crop အပြည့်အစုံ မအလုပ်လုပ်ကြောင်း မသေချာ (စစ်ရန်) | |
| G10 | **Snap guide/safe-area/grid/zoom-fit** controls မရှိ (Player) | |
| G11 | **Toast/notification**၊ onboarding hint၊ empty-state CTA မညီညာ | |
| G12 ✅ **ပိတ်ပြီး** — zoom select က preview zoom ကို ထိန်း (`fornyein:zoom`) — မူလ: **Top bar** ရဲ့ zoom select က ဘာကိုထိန်းလဲ မရှင်း | |
| G13 🟢 — UI မြန်မာ/English toggle (`ui/locale.js`) + **inspector/tab/track label ဘာသာပြန် `ui/labels-my.js`**၊ ကျန် microcopy အနည်းငယ် | |

> **ပိတ်ပြီး (v5.1, 2026-11-23)**: **G1** (Inspector registry — U1)၊ **G2** (right-click context menu + clipboard — U2)၊ **G3** (media → timeline/player drag & drop — U3)။ အထောက်အထား = `public/v2/tests/e2e/ux.js` (headless Chromium)။

---

## ၃။ CapCut-like UX Specification (ဒီ Plan ရဲ့ ဗဟို)

> စံ: "CapCut သုံးဖူးသူ ဘာကိုမှ ပြန်သင်စရာမလိုဘဲ ကိုင်တတ်ရမယ်"။ အောက်ပါတစ်ခုချင်းစီက **တိုင်းတာလို့ရတဲ့ အပြုအမူ** (acceptance)။

### ၃.၁ Workspace layout
- **ဧရိယာ ၆ ခု**: Top bar · Tool rail · **Left panel (assets/tools)** · **Player** · **Inspector (Details)** · **Timeline** · Status bar။ (VidPro layout ကို ထိန်း)
- **Resizable splitters**: Left panel ကျယ်/ကျဉ်း (၂၄၀–၄၈၀ px)၊ Inspector (၂၈၀–၄၂၀)၊ Timeline မြင့် (၂၀၀–၆၀% ရဲ့ viewport)၊ **ဒ္ဒဲ double-click = မူလအတိုင်း**၊ **collapse ခလုတ်** (panel ကို ပိတ်ပြီး Player ကို ကျယ်စေ)။ အရွယ်တွေ **မှတ်ထား** (localStorage)။
- **အနိမ့်ဆုံး ၁၂၈၀×၇၂၀** (ငယ်ရင် ညင်သာစွာချုံ့၊ ၁၁၀၀×၆၄၀ အထိ scroll မဖြစ်)။ ဘာပဲဖြစ်ဖြစ် **Player ကို အနည်းဆုံး ၃၆၀ px အမြင့်** ရအောင်။
- **Full-screen preview** (F)၊ **Player-only mode** (Tab = panel အားလုံး ဝှက်/ပြ)။

### ၃.၂ Top bar
- ဘယ်: Logo · Home · **Project name (inline rename)** · Auto-saved status ("Saved ✓ / Saving… / Unsaved")။
- အလယ်: **Undo / Redo** (disabled state + tooltip ထဲ undo label "Undo: Split clip")။
- ညာ: **Shortcuts (?)** · Theme · **Export** (အဓိက ခလုတ်၊ အပြာ)။ **Preview** ခလုတ်မရှိဘဲ (Player ရှိပြီးသား) — ရှိနေတာကို full-screen preview လုပ်ပေး။
- Zoom select (50–200%) = **Player ရဲ့ canvas zoom** (Player ထဲရွှေ့ပြီး Fit/50/100/200 ပေး)၊ top bar မှာမထား။

### ၃.၃ Tool rail + Left panel (CapCut ရဲ့ အဓိကခံစားမှု)
Rail ကို နှိပ်တိုင်း **ဘယ် panel ပြောင်း** (အလွတ် မရှိရ)။ Panel တိုင်းမှာ **Search + Category chips + Grid/List** + **hover preview** + **click = Timeline ပေါ်ထည့်** (playhead မှာ၊ ရွေးထားတဲ့ track အပေါ်) + **drag = Timeline/Player ပေါ်ချ**။
| Tool | Panel အကြောင်းအရာ | Milestone |
|---|---|---|
| **Media** | Tabs: Local · Library (R2) · Audio · Record။ Import (ခလုတ်+drag file ချ)၊ filter (All/Video/Photo/Audio)၊ **tile: thumbnail + duration + "ထည့်ထား" tick**၊ hover = scrub preview (video)၊ **drag→timeline**၊ right-click (Add/Replace/Reveal/Delete/Relink) | M1 (U3) |
| **Audio** | Music (R2 + ကိုယ်ပိုင်) · Sound effects · **Record voiceover** · Extracted audio၊ preview ▶ ကိုနှိပ်ကြား၊ drag→audio track | M1/M5 |
| **Text** | **Default text** · Presets/Templates (Title, Lower third, Quote, Credits…) · **Captions** (Paste poem၊ Auto-draft၊ SRT import) · Poem Mode · Font manager | M2 |
| **Stickers** | Shapes · Logos/PNG · (နောက်မှ animated) | M3/M6 |
| **Effects** | Category (Trending/Basic/Retro/B&W/Blur…)၊ tile နှိပ် → ရွေးထားတဲ့ clip ကို **effect ထည့်** (fx stack)၊ ရွေးထားတာမရှိရင် "adjustment layer" ထည့်ဖို့ ပေး | M4c |
| **Transitions** | Category၊ clip နှစ်ခုကြား drop/နှိပ်၊ duration slider | M4b |
| **Filters** | Category၊ intensity slider၊ ရွေးထားတဲ့ clip သို့ | M4a |
| **Adjust** | Basic/Color/HSL (brightness/contrast/saturation/temp/tint/highlights/shadows/vignette/sharpen) — **slider များ (Inspector ထဲလည်း ပေါ်)** | M4a |
| **Templates** | Project template / Text template ၊ preview + "Use" | M6 |
| **More** | Settings၊ Shortcuts၊ About၊ Feedback | M1 |
> **စည်းမျဉ်း**: panel မပြည့်စုံသေးတဲ့ tool ကို rail မှာ **မပြ** (သို့ "Coming soon" badge) — ဘာမှမရှိတဲ့ panel ဖွင့်ခိုင်းမလုပ်။ ညာဘက်အောက်က Effects/Transitions/Filters "demo panel" ကို **ဖယ်** (rail ရဲ့ panel နဲ့ ပေါင်း)၊ အစားထိုး = ညာဘက်အောက်နေရာကို **Inspector ကို ပိုမြင့်စေ** သို့ **Keyframe/Mixer panel** အဖြစ်သုံး။

### ၃.၄ Player (Canvas)
- ရွေးထားတဲ့ clip: **bounding box + handle ၈ ခု** (ထောင့် = scale (Shift = ratio ထိန်း/မထိန်း)၊ ကြား = crop/ဘေးဆွဲ၊ အပြင်ထောင့် = rotate)၊ **အလယ်ဆွဲ = ရွှေ့**၊ **center/edge snap guide (ပန်းရောင်မျဉ်း)**၊ rotate မှာ ၁၅° snap (Shift)။ **Double-click စာ = canvas ပေါ်မှာ တိုက်ရိုက်ပြင်** (inline edit)။ Arrow = ၁ px nudge (Shift=၁၀)။
- **Floating toolbar** ရွေးထားတဲ့အရာပေါ် (Duplicate/Delete/Flip/Mask/…)။
- **Player controls**: Play/Pause · ရှေ့/နောက် frame · Timecode · **Canvas zoom (Fit/50/100/200)** · **Ratio (16:9/9:16/1:1/4:5/Custom)** + **"Fit/Fill/Blur-fill" ကြား background ပုံစံ** · **Guides (safe-area ၉:၁၆၊ ပေါင်း၃×၃ grid၊ center)** · **Preview quality (Full/½/¼)** · Fullscreen။
- **Preview quality auto** (frame budget ကျော်ရင် လျှော့)၊ audio ထွက်နေစဉ် A/V ကိုက်။
- Frame ghosting (scrub ချိန် မဲမဲမပေါ်)။

### ၃.၅ Inspector (Details) — **clip အမျိုးအစားအလိုက် tab (G1 ကိုဖြေ)**
| ရွေးထားတာ | Tabs (CapCut-like) | အဓိက controls |
|---|---|---|
| Text | **Basic** · **Animation** · **Effects/Style** · **Captions** | Font/Style/Color(+Fill2/Gradient)/Stroke/Shadow/Glow/Size/Spacing/Align/Opacity/**Transform (X,Y,Scale,Rotate)**/**Timing**; Animation: In/Out/Loop preset + duration; **Apply to all** |
| Video / Image | **Video** (Transform, Opacity, Blend, Crop, Fit) · **Mask** · **Animation** · **Adjust** · **Speed** · **Audio** | slider+number၊ **Keyframe ◆**၊ Reset ↺ |
| Audio | **Basic** (Volume, Fade in/out, Pan, Mute) · **Effects** (EQ/Reverb/Echo/Comp/Noise) · **Speed** | meter၊ Ducking toggle (voice ကိုရွေးထားတဲ့ clip) |
| Sticker/Shape | **Basic** · **Animation** | |
| (မရွေး) | **Project settings** (Ratio, Resolution, FPS, Background, Captions defaults) | |
- **Control စံ**: Slider + Number (drag scrub)၊ **ညာဘက် "↺ reset" + "◆ keyframe"**၊ Color = swatch + eyedropper + recent colors၊ section ကို collapse။ **Undo coalescing** (slider ဆွဲ = undo ၁ ဆင့်)။ **Multi-select** ဆိုရင် တူတဲ့ field ပဲပြ၊ ပြောင်းရင် အားလုံးသက်ရောက်။

### ၃.၆ Timeline (CapCut ရဲ့ နှလုံးသား) — L3 နဲ့ Plan §၅(v4) ရဲ့ spec အားလုံးကို ဒီမှာ UX အဖြစ် အတည်ပြု
- **Track header**: 👁 hide · 🔒 lock · 🔊 mute (audio) / **S solo** · **အမည် double-click rename** · ဆွဲပြန်စီ · **height S/M/L** (right-click) · **+ Add track**။ Video **Main track = magnet ခလုတ်**။
- **Clip anatomy**: type အရောင် (Text ခရမ်း/Video thumbnail strip/Audio waveform/Sticker…)၊ အမည်၊ **အစွန်း handle** (trim)၊ **fade handle** (audio)၊ **keyframe အမှတ်** (အပေါ်မှာ ◆)၊ lock icon၊ selected = ဘောင်အဖြူ+အပြာ။ Zoom ချဲ့ရင် စာသားအပြည့်၊ ချုံ့ရင် icon ပဲ။
- **Gestures**: click ရွေး · Shift/Ctrl+click multi · **box select** · drag ရွှေ့ (**ghost+snap guide**) · edge drag trim (Shift=ripple၊ Ctrl=roll) · Alt+drag = slip · Alt+drag clip = copy · ruler drag = scrub (**audio scrub**)။ **Cursor** ပြောင်း (↔ trim၊ ✋ move၊ ✂ razor)။
- **Right-click menu** (clip): *Cut · Copy · Paste · Duplicate · Delete (Shift=Ripple) · Split · Freeze frame · Reverse · Speed… · Detach audio · Group/Link · Replace media · Properties*၊ (track): *Add track · Rename · Height · Delete track*၊ (ruler/blank): *Add marker · Paste · Zoom to fit*။
- **Toolbar**: Undo/Redo · **Select / Razor (B)** · Split · Delete · Ripple · **Magnet (P)** · **Snap (N)** · **Link** · **Marker (M)** · **In/Out** · Zoom −/+ slider · **Fit (Shift+Z)** · Timeline ကို အမြင့် ပြောင်း။
- **Drop indicator** (media ဆွဲချတဲ့အခါ lane/အချိန်နေရာ အပြာမျဉ်း)၊ track အသစ်ဖွဲ့ရမယ့်နေရာ "+ New track" ပြ။ **Playhead**: အပြာ/လိမ္မော်ရောင် မျဉ်း + ထိပ်တြိဂံ + timecode bubble။
- **Minimap/overview** (ရှည်ရင်)၊ vertical scroll (track များရင်)၊ **auto-follow playhead**။
- အသေးစိတ် edit semantics = `L3` §၃ (T1–T6)။

### ၃.၇ Export flow
- **Export** နှိပ် → **Dialog** (CapCut-like): Title · **Preset** (YouTube 1080p · Reels/TikTok 9:16 · Facebook · Draft 720p · Custom) · Resolution · FPS · Quality/Bitrate · Format (MP4 ပင်မ) · **Captions: burn-in / SRT ဖိုင်ပါထုတ်** · **Audio only** · Range (အားလုံး/In-Out)။ ဘာကြောင့် codec ဘာသုံးလဲ ပြ (AAC မရ → WebM အကြံပေး)။
- Progress (phase: Audio → Frames → Finalize + ETA)၊ **Cancel**၊ ပြီးရင် **self-check** ရလဒ် (video+audio ပါ၊ duration) + "ဖိုင်ဖွင့်/folder ပြ"။ အမှားဆိုရင် **ဘာဖြစ်လဲ+ဘာလုပ်ရမလဲ** (မြန်မာ) + "Copy diagnostics"။

### ၃.၈ Interaction စည်းမျဉ်း၊ Microcopy၊ Feedback
1. **Selection-driven** (G1)၊ **Undo ၁၀၀%** (Undo label ပါ)၊ destructive ကို confirm မလို (undo ရလို့) — project/file ဖျက်မှ confirm။
2. **အလုပ်ရှည် (> ၁ s) = progress+cancel**၊ ပုံမှန် feedback = **toast** (ထိပ်/အောက်ညာ ၃ s)၊ အမှား = banner+အကြောင်းပြ+လုပ်ရန်။
3. **Empty state** တိုင်း **CTA တစ်ခု** ("ဖတ်သံ ထည့်ပါ"၊ "စာတန်း ထည့်ပါ")၊ **ပထမဆုံး ဖွင့်ချိန် coach marks** ၅ ခု (Media → Timeline ဆွဲ၊ Split၊ Text၊ Export…)။
4. **Tooltip** တိုင်းမှာ shortcut ပါ၊ disabled ဖြစ်ရင် အကြောင်းရင်းပြ။
5. **Burmese-first microcopy**: label = English (နမူနာကိုက်)၊ **tooltip/toast/error/empty-state/dialog = မြန်မာ** (G13)၊ UI အပြည့်မြန်မာ toggle = M8။
6. **Motion** ၁၂၀–၁၈၀ ms၊ skeleton loading၊ Layout မရွေ့။ **A11y**: focus ring၊ keyboard-only editing၊ AA contrast၊ `aria-label`။

### ၃.၉ Shortcut map (CapCut default နဲ့ ကိုက်အောင် — `docs/shortcuts.md`)
Space play/pause · **Ctrl+B / S split** · Delete (Shift=ripple) · **Ctrl+Z / Ctrl+Shift+Z (Y)** · Ctrl+C/V/X/D · **Q / W** (ဘယ်/ညာ ဖျက်) · ←/→ frame (Shift=၁ s) · ↑/↓ edit point · Home/End · **+ / −** zoom · **Shift+Z** fit · **N** snap · **P** magnet · **M** marker · **I/O** in/out · **B** razor · **V** select · **F** fullscreen · **?** shortcuts dialog · Ctrl+S project save · Ctrl+E export · J/K/L shuttle · `\` loop။

### ၃.၁၀ Visual design system
- Tokens (ရှိပြီး: dark/light)၊ **clip အရောင်**: Text ခရမ်း `#6553ca`၊ Video အပြာ thumbnails၊ Audio စိမ်း waveform၊ Overlay/Sticker လိမ္မော်၊ Adjust/Effect ပန်းရောင်၊ Selected = ဖြူ+အပြာဘောင်၊ Playhead `#f76850`။
- Component စာရင်း: Slider+Number ✅၊ Switch ✅၊ Segmented ✅၊ Select ✅၊ **Color+Eyedropper**၊ **Curve editor**၊ **Keyframe ◆**၊ **Context menu**၊ **Dialog/Modal**၊ **Toast**၊ **Splitter**၊ **Asset card (hover preview)**၊ **Coach mark**၊ **Tooltip(shortcut)**။ Icon = ကိုယ်ပိုင် (inline SVG)။

---

## ၄။ Feature Parity (အကျဉ်း — အသေးစိတ် L2a §၂ + D5 အစဉ် DECISIONS.md)

**ဦးစားပေးအစဉ် (D5 — ရွေးပြီး)**: Text/Poem (M2) → **Transform+Keyframes** (M3) → **Adjust/Filters** (M4a) → **Transitions** (M4b) → **Audio polish: Noise reduction+Loudness+Ducking** (M5a) → Effects (M4c) → Speed/Reverse/Freeze (M5b) → Stickers/Templates (M6) → Mask (M4d) → **Auto captions** (benchmark အောင်မှ၊ M7) → AI/P3။
**မလုပ်**: motion tracking · script-to-video · cloud/share · CapCut ရဲ့ copyright library။

---

## ၅။ Architecture (CapCut-like engine)

- **Stack**: Preact+htm (CDN ပုံသေ) · Canvas2D→**WebGL2 compositor** · Web Audio · WebCodecs + **Mediabunny** · IndexedDB (project) + **OPFS** (media) · Workers (decode/peaks/thumbnail/export) · R2 (library/fonts) · Cloudflare Worker (API)။
- **Project model v4**: `project → tracks → clips`၊ clip = `{start,dur, src{mediaId,in,out}, speed, reverse, transform(animatable), fx[], mask, trIn/trOut, link, …}`။ `prop = number | {keys:[{t,v,ease}]}`၊ **`srcTime(clip,t)`** တစ်ခုတည်း၊ အချိန် = စက္ကန့် + frame quantize၊ `migrate()` + `validate()`။
- **Render**: `buildFrame(project,t)` (pure၊ test လုပ်လို့ရ) → Compositor → Preview/Export တူ။ **Effects/Transitions/Mask** = shader registry (data-driven)၊ Inspector က schema နဲ့ UI ပုံဖော်။
- **Audio**: `planSchedule` + **audio-graph (Preview/Export တူ)**၊ AudioBufferSource schedule၊ ရှည်တဲ့ media = element path၊ AudioWorklet (noise reduction/beat) နောက်မှ။
- **Command layer** (`timeline.js`): edit အားလုံး commands (undo label၊ validation)၊ UI က project ကို တိုက်ရိုက်မပြင်ရ။
- **UI architecture**: `ui/` ကို feature folder ခွဲ (`panels/`, `inspector/`, `timeline/`, `player/`, `dialogs/`, `widgets/`)၊ **Inspector registry** (clip kind → tabs → controls schema)၊ **Panel registry** (tool → panel component)၊ **ContextMenu registry** (target → items)၊ **Shortcut registry** (key → command)။ ဒါတွေ data-driven ဖြစ်တော့ feature အသစ်ထည့်တာ core မပြင်ရ။
- အသေးစိတ် contract: `L3` §၂–၄၊ L2a §၃။

---

## ၆။ လမ်းပြမြေပုံ — Milestone တိုင်းမှာ **Engine + UX** နှစ်ခုလုံး

**UX Work Packages (U)** — Milestone တွေထဲ ပါဝင်:
| U | အလုပ် | ဖြေတဲ့ GAP | မူတည် |
|---|---|---|---|
| U1 | **Inspector registry** (clip kind → tabs) + Project settings (မရွေးခဲ့ရင်) | G1 | S3 |
| U2 | **Context menu** (clip/track/ruler) + registry | G2 | T1 |
| U3 | **Drag & drop** (Media/Audio panel → Timeline/Player) + ghost + drop indicator + Import by drag file | G3 | S5, T1 |
| U4 | **Splitters + collapse + layout persist + Player-only mode** | G6 | – |
| U5 | **Track header** (mute/solo/rename/height/reorder/add) | G7 | S5 |
| U6 | **Timeline toolbar** အပြည့် (Razor, Magnet, Link, Marker, In/Out, Delete L/R, Fit) | G8 | T2–T3 |
| U7 | **Player** handles + snap guides + safe-area + canvas zoom/ratio + floating toolbar 🟢 (safe area၊ center guide၊ zoom 25–200%၊ F၊ visual box) | G9, G10 | M3 |
| U8 | **Left panels အပြည့်** 🟢 (`panels-tools.js` — Audio/Stickers/Effects/Transitions/Filters/Adjust/Templates/More၊ **G5 demo fx panel ဖျက်ပြီး**၊ inspector အမြင့်အပြည့်) | G4, G5 | M2–M6 |
| U9 | **Keyframes UI** 🟢 (`keyframes.js`၊ ◆၊ timeline diamond၊ inspector၊ **curve editor** `ui/curve-editor.js`) | G9 | M3 |
| U10 | **Export dialog** (preset/format/range/captions) ✅ (E1) | – | S2 |
| U11 | **Shortcuts dialog + CapCut keymap + registry** ✅ (`ui/keymap.js`, `ui/shortcuts-dialog.js`) | – | T-all |
| U12 | **Toast/Coach marks/Empty-state CTA/Microcopy (မြန်မာ)** 🟢 toast၊ empty-state card၊ ၅ ဆင့် coach tour | G11, G13 | – |
| U13 | **A11y + responsive (၁၂၈၀×၇၂၀)** 🟢 (focus-visible၊ aria၊ tabIndex၊ media query၊ e2e tools) | – | M8 |

| Milestone | Engine | **UX (U)** | ထွက်ပေါက်စံ |
|---|---|---|---|
| **M1 Core NLE** | S1–S8 (မြန်မာစာ၊ export အသံ၊ `src` v4၊ audio schedule၊ lane၊ audio graph) + T1–T6 (command/tools/selection/scrub/perf/caption) + E1 | **U1 U2 U3 U4 U5 U6 U10 U11 U12(အစ)** | X1–X7 (L3 §၀) + **UX gate**: G1–G3, G6–G8 ပိတ်၊ CapCut-user test (§၇) |
| **M2 Text & Captions** | text template/animation/SRT/Poem Mode/font manager/Zawgyi | **U8 (Text/Audio panel)**၊ U12 | မြန်မာ corpus ၁၀၀%၊ ကဗျာ ၃ ပုဒ် e2e |
| **M3 Transform & Keyframes** | `buildFrame`+WebGL2 compositor၊ transform/crop/opacity/fit/canvas bg၊ keyframes | **U7 U9** (+ Stickers panel) | golden frame၊ keyframe preview=export |
| **M4 Visual FX** (a Adjust/Filters → b Transitions → c Effects → d Mask) | shader registry၊ fx stack၊ transition | **U8 (Adjust/Filters/Transitions/Effects panels)** + Inspector Adjust/**Mask 🟢** tab | effect ≥၁၅၊ **transition ≥၈ 🟢 (၈ မျိုး + none)**၊ **mask 🟢 (rect/ellipse + invert)**၊ GPU fallback |
| **M5 Audio & Time** (a Noise/Loudness/Ducking → b Speed/Reverse/Freeze) | speed time-map 🟢 (`setClipSpeed`၊ `srcTime` reverse)၊ noise reduction/loudness ကျန် | Inspector **Speed tab** 🟢 (0.25×–4×၊ reverse)၊ **Mixer panel 🟢** (`ui/mixer-dialog.js` — volume/pan/mute/solo/ducking + live meter၊ e2e `mixer.js`) | A/V drift ≤၄၀ ms (speed ပါ) |
| **M6 Templates & Assets** | **project template 🟢 ၅ ခု** (`engine/templates.js` + `ui/panels-templates.js`၊ e2e `templates.js` ၈)၊ text preset၊ asset relink 🟢၊ stickers 🟢 | U8 (Templates/Stickers) | template ၅ ခု ✅ |
| **M7 AI/Smart** | Auto captions (benchmark အောင်မှ)၊ bg removal | caption UX | CER ကန့်သတ်ချက်အောက် |
| **M8 Polish & Release** | proxy/OPFS/large project၊ perf၊ Access ဖွင့် | **U13** 🟢၊ onboarding 🟢၊ UI မြန်မာ toggle 🟢 | Release gate (§၈) |
**v1.0 = M1 + M2**။ M3+ ကို အစဉ်လိုက်။ M1 မပြီးမချင်း M2+ မစ။

---

## ၇။ အလုပ်လုပ်ပုံ၊ စစ်ဆေးမှု၊ Definition of Done

1. **Writer တစ်ယောက်** · WP တစ်ခု = branch/PR တစ်ခု (≤ ~၄၀၀ လိုင်း) · CI စိမ်းမှ merge · ဖိုင် ≤ ၃၀၀ လိုင်း၊ လိုင်း ≤ ၁၆၀ လုံး။
2. **စမ်းမှ တင်**: node syntax + unit + `known-bugs` + e2e (headless Chromium) + Export ဆိုရင် **ffprobe**။
3. **UX စစ်ဆေးမှု 3 ဆင့်**: (က) **e2e gesture test** (mouse drag/right-click/keyboard)၊ (ခ) **screenshot နှိုင်း** (နမူနာ layout၊ dark/light)၊ (ဂ) **CapCut-user test** — CapCut သုံးဖူးသူ (သင်) က **task ၁၀ ခု** ကို ညွှန်ကြားချက်မပါဘဲ လုပ်ကြည့် (ဥပမာ: ဖတ်သံထည့်၊ ဖြတ်၊ စာထည့်၊ ရွှေ့၊ Music ထည့်+အသံချ၊ export) → မလုပ်နိုင်တာကို GAP အသစ်မှတ်။
4. **Status ကို အထောက်အထားနဲ့ပဲ** (🟢 = ဘာနဲ့စစ်ကြောင်း ရေး)၊ **သင့် Chrome စစ်စာရင်း** (`VERIFY §3`) မပါရင် 🟡။
5. **DoD**: unit+e2e (သို့ ffprobe) + လက်ဖြင့်စစ်စာရင်း ✓ + docs/Plan update + (UI ဆိုရင်) screenshot dark/light။
6. **CapCut မကူး** — UI/icon/asset/စာသား ကိုယ်ပိုင်။ Binary (font/ပုံ) သင်ကိုယ်တိုင်တင် (R2/GitHub web)။

---

## ၈။ Release gate (v1.0 = M1 + M2) နဲ့ Metrics

1. ကဗျာတစ်ပုဒ် (ဖတ်သံ+စာသား) → စာတန်းချိန်ကိုက် → စာပုံစံ → Music/နောက်ခံ → **အသံပါ MP4** (ffprobe: video+audio၊ drift ≤ ၄၀ ms)၊ **မြန်မာစာ ၁၀၀% မပျက်**။
2. Reload လုပ်ရင် project+media မပျောက်။ ဖြတ်/ရွှေ့/trim/undo တိုင်း မကျိုး၊ **Preview=Export**။
3. Chrome/Edge တည်ငြိမ်၊ ၅ မိနစ်ကဗျာ preview ≥ ၃၀ fps၊ ၁၀၀၀ clip pan/zoom ≥ ၆၀ fps၊ project ဖွင့် ≤ ၃ s။
4. ကိုယ်ပိုင် font (R2) သုံးလို့ရ။
5. **UX gate**: G1–G8 ပိတ် · **CapCut-user test** task ၁၀ ခုမှ ≥ ၉ ခု ညွှန်ကြားချက်မပါ အောင်မြင် · TTFV ≤ ၁၅ မိနစ် (၁ မိနစ်ကဗျာ၊ ပထမဆုံးသုံးသူ)။

---

## ၉။ အန္တရာယ်

| အန္တရာယ် | ကာကွယ်ရေး |
|---|---|
| "✅ ပြီး" လို့ပြောပြီး မစစ်ထား | status စကားလုံး၊ အထောက်အထား၊ VERIFY ပြန်တိုက် |
| Writer နှစ်ယောက် ပြိုင်ရေး → ဖိုင်ထပ်ရေးခံရ (၂ ကြိမ်ကြုံ) | writer တစ်ယောက်၊ branch/PR၊ SHA update |
| UX ကို CapCut လို မရအောင် (အပြုအမူ အသေးစိတ်လွဲ) | §၃ acceptance၊ CapCut-user test၊ gesture e2e |
| Scope ကြီး | milestone gate၊ D5 ဦးစားပေး၊ M1+M2 မပြီးမချင်း M3+ မစ |
| မြန်မာစာ ပျက် | policy + corpus test (B1) |
| Preview≠Export | pure `buildFrame`+shared audio graph၊ golden test |
| GPU/browser ကွဲ | Canvas2D fallback၊ feature ပိတ်+အသိပေး |
| Performance (clip များ၊ ဗီဒီယိုကြီး) | virtualize၊ LOD peaks၊ worker၊ proxy (M8)၊ limit ၁၀၈၀p/၁၀ မိနစ် |
| ကုဒ် ဖတ်မရ (one-liner ရှည်) | style စည်းမျဉ်း+CI၊ ပြင်သမျှ ပြန်ဖွဲ့ |
| `/api/*` public၊ ASR privacy | Access (M8)၊ origin check၊ ခွင့်ပြုချက် |
| Font/asset လိုင်စင်၊ CapCut IP | private R2 font၊ ကိုယ်ပိုင် asset/UI |

---

## ၁၀။ ဆုံးဖြတ်ချက် (အကျဉ်း — အပြည့်အစုံ `DECISIONS.md`)

D0 CapCut-class · D0a UI ကိုယ်ပိုင်/အပြုအမူ CapCut · D0b Phase S အရင် · D1 WebGL2 compositor · D2 OPFS · D3 schema v4 ကြိုထား · D4 Preact+htm · D5 ဦးစားပေးအစဉ် (§၄) · D6 ၁၀၈၀p ≤ ၁၀ မိနစ် · D7 CapCut shortcut · D8 main-track magnet ON · D9 စက္ကန့်+quantize · D10 lane မထပ် · D11 label EN / microcopy မြန်မာ · D12 Transitions ထည့်၊ sticker pack မလုပ် · D13 Zawgyi = rabbit vendor+confirm · D14 `normalizeMyanmar` ဖျက် · D15 MP4=H.264+AAC၊ မရရင် WebM၊ self-check · D16 Web Audio schedule · D17 repo စည်းမျဉ်း · D18 ASR benchmark ဂိတ် · D19 persona · D20 font private R2။
**UX spec Part 0** (`docs/plan/ux/00-principles-states-tokens.md`) ကို လိုက်နာ: colour tokens `--success/--warn/--danger/--info/--selection-outline/--snap-guide` 🟢၊ focus-visible ring 🟢၊ disabled cursor 🟢၊ reduced motion 🟢၊ မြန်မာ line-height 1.6 🟢၊ toast 3s (error 6s, hover pause) 🟢။

**အသစ် (v5)**: **D21** UI/UX ကို Plan ဗဟိုအပိုင်း (§၃) အဖြစ် သတ်မှတ်၊ UX GAP G1–G13 ကို milestone ထဲ ထည့်၊ **panel registry/inspector registry/context-menu registry/shortcut registry** ဖြင့် data-driven UI ဖွဲ့၊ "demo/အလွတ် panel" မပြရ။ **D22** UX လက်ခံစစ်ဆေးမှု = **CapCut-user test** (သင်က task ၁၀ ခု ညွှန်ကြားချက်မပါ)။

**ဆုံးဖြတ်ရန်ကျန် (Open)**: O1 ကိုယ့်ကဗျာဖတ်သံ ၁–၂ မိနစ်+စာသား · O2 Access AUD tag · O3 သင့် Chrome စစ်ချိန် · O4 `/v2`→ပင်မလိပ်စာ (v1.0 ပြီးမှ)။

---

## ၁၁။ နောက်ထပ် လုပ်ရမယ့်အရာ

1. **Plan ကို ဆက်မြှင့်**: **L2b — CapCut-like UI/UX Detailed Spec** (§၃ ကို screen/state/interaction table အဆင့်သို့ — panel တစ်ခုချင်း၊ context-menu item တစ်ခုချင်း၊ shortcut တစ်ခုချင်း၊ state (hover/active/disabled/error)၊ wireframe ASCII) → L4 test catalog (UX test ပါ) → L5 M2–M8 → L6 release/ops။
2. (သင်ပြောမှ) **Phase S + U-items** ကို ကုဒ်စ — အစဉ် L3 §၁ + U1–U6။ **လုပ်ပြီး**: S1–S8 (CI file မှလွဲ၍), T1–T6, E1, U1–U6, U10–U13 အားလုံး။ **နောက်**: U7–U13 (Plan အသစ် ဖြည့်လာသည်အထိ)။
3. သင်ပြင်ဆင်ရန်: CapCut-user test အတွက် task ၁၀ ခုကို စစ်ကြည့်ရန် အချိန်၊ ကိုယ့်ကဗျာဖတ်သံ၊ Access AUD tag။

---

## နောက်ဆက်တွဲ — v1 → v2 အင်္ဂါရပ် လွှဲပြောင်း (အခြေအနေ)
Tap-sync/Auto-draft/Review/Lock 🟡(Auto-draft 🟢) · စာ effect ၁၅/animation/preset/အရောင်နှစ်မျိုး/stroke 🟡 · Zawgyi 🟡 B1 ပြင်ပြီး (confirm UX ကျန်) · Font R2 🟡 · R2 tiles/Record 🟡 · Mixer preview 🟢/export 🟢 B6 (e2e `mixdown.js` ၉ ခု၊ clip FX chain bypass ပြင်ပြီး) · Title/Credits 🟡၊ SRT 🟢 · MP4 export 🟡 B2/B3/B8 ပြင်ပြီး (ffprobe ✅၊ နားနဲ့မစစ်) · ဖတ်သံ split/trim 🔴 B4 · 9:16 safe-area ⏸ (U7)။
