# UX Spec · Part 1 — Workspace Layout · Top bar · Status bar · Global behaviours

(Part 0 ရဲ့ token/state/motion ကို သုံး။ အဆင့်: **M1** မဟုတ်ရင် milestone ကို ဖော်ပြ။)

---

## ၁.၁ Layout grid (ကိုးကား viewport ၁၄၄၀×၉၀၀)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR  56px                                                                      │
├──────┬──────────────┬─┬───────────────────────────────────┬─┬─────────────────────┤
│      │              │S│                                   │S│                     │
│ RAIL │  LEFT PANEL  │P│            PLAYER                 │P│     INSPECTOR       │
│ 78px │  330 (240–480)│L│   (min height 360, flex)          │L│   330 (280–420)     │
│      │              │I│                                   │I│                     │
│      │              │T│                                   │T│                     │
├──────┴──────────────┴─┴───────────────────────────────────┴─┴─────────────────────┤
│  ═══════════ horizontal SPLITTER (timeline မြင့်) ═══════════                       │
│ TIMELINE  default clamp(236px, 34vh, 320px)  — min 200px, max 60% of main height   │
├────────────────────────────────────────────────────────────────────────────────────┤
│ STATUS BAR 46px                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```
- Gap ၈ px၊ panel radius ၁၂၊ border ၁ px `--line`။ Rail က Left panel နဲ့ Timeline နှစ်ခုလုံးရဲ့ ဘယ်ဘက်မှာ အမြင့်အပြည့် (VidPro နမူနာ)။
- **ညာဘက်အောက်က "Effects demo panel"** (လက်ရှိ) ကို **ဖယ်** — Inspector က ညာတစ်ဖက်လုံး အမြင့်အပြည့်ယူ (Part 4)။ (G5)

| ဧရိယာ | default | min | max | resize | collapse | persist |
|---|---|---|---|---|---|---|
| Left panel | 330 | 240 | 480 | ✅ splitter | ✅ | ✅ |
| Inspector | 330 | 280 | 420 | ✅ | ✅ | ✅ |
| Timeline (အမြင့်) | clamp(236,34vh,320) | 200 | 60% | ✅ | ❌ (အနည်းဆုံး ruler+၁ track) | ✅ |
| Player | flex | **အမြင့် ၃၆၀** | – | – | – | – |
| Rail | 78 | 64 (label ဖျောက်) | – | ❌ | ❌ | – |

---

## ၁.၂ Splitter စည်းမျဉ်း (G6)

| ကဏ္ဍ | အပြုအမူ |
|---|---|
| Hit area | ၈ px (မြင်ရတာ ၂ px)၊ hover = `--accent` ၁၂၀ ms၊ cursor `col-resize`/`row-resize` |
| Drag | live resize (rAF throttle)၊ min/max ကို clamp၊ **default ±၁၂ px အနီးမှာ snap** |
| Double-click | default အရွယ်သို့ ပြန် |
| Keyboard | splitter ကို Tab focus → `←/→` (သို့ `↑/↓`) ၁၆ px၊ Shift ၆၄ px၊ `Home` = default၊ `Enter` = collapse/expand |
| Collapse | splitter hover မှာ chevron ပေါ်၊ နှိပ်ရင် panel ၀ ထိ (၁၈၀ ms)၊ ဘောင်ဘေးမှာ **၁၄ px edge handle + chevron** ကျန်ပြီး ပြန်ဖွင့်ရန် |
| Player min | Timeline/panel ချဲ့လို့ Player အမြင့် < ၃၆၀ ဖြစ်မယ်ဆို drag ကို ရပ် (clamp) |
| Persist | `localStorage["fn.layout.v1"] = {leftW, inspW, tlH, leftCollapsed, inspCollapsed}` — ဖွင့်တိုင်း ပြန်သုံး၊ **View → Reset layout** (Settings/Menu) |
| Window resize | အချိုးကို ထိန်း (px မဟုတ်ဘဲ ကျန်နေရာထဲ ပြန်ညှိ)၊ min ထက်နိမ့်ရင် စောစော collapse (inspector ပထမ၊ left panel ဒုတိယ) |

---

## ၁.၃ Responsive နဲ့ Browser gate

| viewport | အပြုအမူ |
|---|---|
| ≥ ၁၄၄၀ | default |
| ၁၂၈၀–၁၄၃၉ | left/inspector default ၃၀၀၊ rail label ပြ |
| ၁၁၀၀–၁၂၇၉ | left/inspector ၂၈၀၊ rail label ဖျောက် (icon+tooltip)၊ status bar အချို့ဖျောက် |
| **အမြင့် < ၇၀၀** | rail label ဖျောက်၊ track အမြင့် S၊ tltools padding လျော့ |
| < ၁၁၀၀×၆၄၀ | **ပိတ်ဆို့မဟုတ်၊ banner**: "ဒီ app ကို ၁၁၀၀×၆၄၀ နဲ့အထက် မျက်နှာပြင်မှာ သုံးပါ" + "ဆက်သုံးမယ်" ခလုတ် (scroll ပေးမယ်) |
| Touch/ဖုန်း | မပံ့ပိုး — "Desktop Chrome/Edge သုံးပါ" စာမျက်နှာ |

**Browser capability gate** (ဖွင့်ချိန် တစ်ကြိမ်): `WebCodecs (VideoEncoder/Decoder, AudioEncoder)`၊ `AudioContext`၊ `IndexedDB`၊ `OffscreenCanvas`၊ (M3+) `WebGL2`၊ (M8) `OPFS`။ မရှိရင် **ကျန်တာမလုပ်ဘဲ** ရှင်းရှင်းလင်းလင်းစာမျက်နှာ: "Chrome/Edge (နောက်ဆုံး ၂ version) သုံးပါ — မရှိတာ: {စာရင်း}" + "Diagnostics ကူးယူ"။ တစ်စိတ်တစ်ပိုင်းပဲမရရင် (ဥပမာ AAC မရ) app ဖွင့်ပေး + Export dialog မှာပဲ သတိပေး။

---

## ၁.၄ Player-only နဲ့ Fullscreen mode

| Mode | Key | အပြုအမူ |
|---|---|---|
| **Player-only** | `Tab` (input မပါ) | Left panel + Inspector ကို ဝှက် (collapse)၊ Timeline ကျန်၊ Player ကျယ်၊ ထပ်နှိပ် = ပြန်ပြ |
| **Fullscreen preview** | `F` / Top "Preview" | Browser fullscreen၊ Player အပြည့်၊ **overlay controls** (play, scrub bar, time, exit) ၂.၅ s မလှုပ်ရင် ဖျောက်၊ `Space` play/pause၊ `Esc` ထွက်၊ mouse လှုပ်ရင်ပြ၊ project ကို **playhead မှာ** စ |
| **Focus mode** | Shift+Tab | Timeline ပါ ဝှက် — ✅ (rail/panels/timeline အားလုံး ဝှက်၊ player အပြည့်၊ `.focuspill`) |

---

## ၁.၅ Top bar (အမြင့် ၅၆)

**ဘယ်မှ ညာ**: `Logo` · `Home` · `My Projects ▾` · **Project name** · **Save status** ··· (spacer) ··· `Undo` `Redo` · `⌨ Shortcuts` · `Preview` · **`Export`** · `☀/🌙` · `⚙ Settings`
| Element | အပြုအမူ | States | Shortcut | Microcopy (tooltip) |
|---|---|---|---|---|
| Logo | Home dialog ဖွင့် | – | – | "ပင်မ / Project စာရင်း" |
| Home | Projects dialog (Part 6) | – | Ctrl+Alt+H | "Project စာရင်းဖွင့်" |
| My Projects ▾ | dropdown (§၁.၇) | open/close | – | "မကြာသေးခင် project များ" |
| **Project name** | နှိပ် = inline input၊ **Enter** သိမ်း၊ **Esc** ပယ်၊ blur = သိမ်း၊ အလွတ်=`Untitled Project`၊ ≤ ၈၀ လုံး၊ မြန်မာစာ OK | view/edit | F2 | "Project နာမည်ပြင်" |
| **Save status** | စာသား+icon | **Saved ✓ (၃ s အကြာ → "Saved")** · `Saving…` (spinner) · `Unsaved changes` (ဝါ) · `Save failed ⚠` (အနီ၊ နှိပ် = အကြောင်းရင်း dialog + "Project JSON export") · `New project` | – | "နောက်ဆုံးသိမ်းချိန်: ၁၄:၂၃" |
| **Undo / Redo** | undo/redo | disabled (အဆင့်မရှိ) | Ctrl+Z / Ctrl+Shift+Z·Y | **"Undo: Split clip"** (command label)၊ disabled = "နောက်ပြန်စရာမရှိ" |
| ⌨ Shortcuts | dialog (Part 7) | – | `?` | "Keyboard shortcut များ" |
| **Preview** | Fullscreen preview | disabled (clip မရှိ) | F | "Fullscreen နဲ့ ကြည့်" |
| **Export** (primary) | Export dialog | enabled · disabled(empty) · **running (ring+% )** | Ctrl+E | "MP4 ထုတ်"၊ disabled = "Clip အနည်းဆုံး ၁ ခု ထည့်ပါ" |
| Theme | dark/light | on/off | – | "အမှောင်/အလင်း" |
| **⚙ Settings** (avatar အစား၊ account မရှိလို့) | Settings dialog (§၁.၉) | – | – | "ဆက်တင်" |
- **ဖယ်**: Top bar ထဲက zoom select (50–200%) → **Player ရဲ့ canvas zoom** (Part 3) သို့ ရွှေ့ (G12)၊ `N` avatar ဖယ်။
- **Tab order**: Logo → Home → My Projects → Project name → Undo → Redo → Shortcuts → Preview → Export → Theme → Settings → (Rail…)။
- Export ခလုတ် **running** ဖြစ်နေစဉ် နှိပ် = progress dialog ပြန်ဖွင့်။

---

## ၁.၆ Status bar (အမြင့် ၄၆)

| ဘယ် → ညာ | အကြောင်းအရာ | အပြုအမူ |
|---|---|---|
| Project | `Project: {name}` | နှိပ် = rename |
| Resolution | `Resolution: 1920 × 1080 (16:9)` | နှိပ် = Project settings dialog |
| FPS · Duration | `30 fps · 00:03:20` | | 
| Selection | `၃ clips ရွေးထား` (ရွေးထားမှ) | |
| Perf (dev toggle) | `fps 58 · render 6 ms` | Settings ထဲ |
| ··· | | |
| **Save Project** (ghost) | manual save (Ctrl+S) → toast "သိမ်းပြီး ✓" | disabled မလို (အမြဲ) |
| **Export Video** (primary) | = Top Export | disabled(empty) |
- ကျဉ်းရင် (< ၁၂၈၀): FPS/Duration/Selection ကို ဖျောက်၊ Resolution ပဲ။

---

## ၁.၇ "My Projects ▾" dropdown

Items (အပေါ်ကနေ): `＋ New project` (Ctrl+Alt+N) · `📂 Open…` (Projects dialog) · **မကြာသေးခင် ၈ ခု** (နာမည်, "၃ နာရီက") — ရွေး = ဖွင့် (လက်ရှိ project မသိမ်းရသေးရင် autosave ပြီးမှ) · `⬆ Import project (.json)` · `⬇ Export project (.json)` · `⧉ Duplicate` · `✎ Rename` · `🗑 Delete…` (confirm)။
- Hover item = နောက်ခံ၊ **ညာဘက်မှာ ✕ (ဖျက်) မပြ** (dropdown ထဲက ဖျက်တာ မမှားအောင် Delete ကို menu ထဲပဲ)။
- ဖွင့်ထားတဲ့ project ကို ✓ ပြ၊ empty = "သိမ်းထားတဲ့ project မရှိသေးပါ"။

---

## ၁.၈ Global behaviours

| ကဏ္ဍ | စည်းမျဉ်း |
|---|---|
| **Autosave** | edit ပြီး ≤ ၁ s (debounce ၇၀၀ ms)၊ `visibilitychange(hidden)`/`pagehide` မှာ အတင်းသိမ်း၊ Export လုပ်နေစဉ် `beforeunload` သတိပေး |
| **Storage persist** | ပထမ save မှာ `navigator.storage.persist()` တောင်း + toast "Browser က ဒေတာမဖျက်အောင် တောင်းထားတယ်" |
| **Crash recovery** | ဖွင့်ချိန် "မပြီးခဲ့တဲ့ session ရှိ" flag ရှိရင် dialog: `ပြန်ဖွင့်` / `ပယ်` |
| **Multi-tab** | project ကို tab နှစ်ခုမှာ ဖွင့်ရင် နောက်ဖွင့်တာ **read-only banner** ("ဒီ project ကို တခြား tab မှာ ဖွင့်ထားတယ်") (`BroadcastChannel`/Web Locks) |
| **Window title** | `● {name} — For Nyein` (● = unsaved) |
| **Deep link** (P2) | `/v2/#p={id}` |
| **Unsaved-state** | tab ပိတ်မယ့်အခါ autosave မပြီးသေးရင်သာ `beforeunload` |
| **Offline** | app shell ကို cache (service worker, M8)၊ အခုတော့ CDN ပျက်ရင် banner "အင်တာနက်လို" |

---

## ၁.၉ Settings dialog (⚙)

| အုပ်စု | ရွေးချယ်စရာ | Default |
|---|---|---|
| General | Theme · UI language (P2) · **Timecode format** (HH:MM:SS:FF / seconds) | Dark · EN · HH:MM:SS:FF |
| Editing | **Snap** on/off + threshold (၄–၁၂ px) · **Main-track magnet** (default) · **Auto-follow playhead** (Auto/Smooth/Off) · Default clip duration (text ၃ s, image ၅ s) | on·8px·ON·Auto |
| Playback | **Preview quality** (Auto/Full/½/¼) · GPU compositor (M3+) · Audio output latency compensation (ms) | Auto |
| Autosave | Interval (၀.၇–၅ s) · Persist storage | 0.7 s |
| Advanced | Show perf HUD · Reset layout · Clear caches (peaks/thumbnails) · Copy diagnostics | off |
- ပြောင်းတာ **ချက်ချင်း သက်ရောက်**၊ Reset to defaults ခလုတ်။
- **အကောင်အထည် (2026-11-23)**: `engine/settings.js` (`fn.settings.v1`) + `ui/settings-dialog.js` — group ၅ ခုလုံး၊ theme/timecode/snap+threshold/magnet/follow/text+image duration/preview quality cap/autosave delay/perf HUD/Reset defaults/Reset layout/Clear caches/Copy diagnostics။ e2e: dialog group စစ်၊ timecode `0:00`၊ HUD fps၊ persist၊ Reset defaults။

---

## ၁.၁၀ Acceptance (Part 1)

| ID | စစ်ချက် |
|---|---|
| UX-LAY-01 | Splitter ၃ ခု drag/double-click/keyboard/collapse အလုပ်လုပ်၊ reload မှာ ပြန်ပေါ် (`fn.layout.v1`) |
| UX-LAY-02 | Player အမြင့် < ၃၆၀ မဖြစ်စေ (clamp) |
| UX-LAY-03 | ၁၁၀၀×၆၄၀ / ၁၂၈၀×၇၂၀ / ၁၄၄၀×၉၀၀ တွင် page scroll မရှိ၊ screenshot dark+light |
| UX-LAY-04 | Capability gate: WebCodecs မရှိတဲ့ browser (mock) မှာ gate စာမျက်နှာ၊ ရှိရင် မပေါ် |
| UX-LAY-05 | `Tab` player-only၊ `F` fullscreen overlay ၂.၅ s auto-hide၊ Esc ထွက် |
| UX-LAY-06 | ညာဘက်အောက် demo panel မရှိ၊ Inspector အမြင့်အပြည့် — ✅ (`.fxpanel` ဖျက်ပြီး grid က inspector ကို row ၂ ခုလုံး ပေး၊ e2e စစ်) |
| UX-TOP-01 | Project name inline rename (Enter/Esc/blur)၊ မြန်မာစာ၊ အလွတ်=Untitled — ✅ click/F2 (e2e) |
| UX-TOP-02 | Save status ၅ မျိုး (Saved/Saving/Unsaved/Failed/New) ပြောင်း (storage error ကို mock) — ✅ + Failed ကို နှိပ်ရင် retry (e2e) |
| UX-TOP-03 | Undo/Redo tooltip မှာ command label၊ disabled မှာ အကြောင်းရင်း |
| UX-TOP-04 | Export disabled (empty) + tooltip၊ running မှာ ring |
| UX-TOP-05 | Tab order မှန် (§၁.၅)၊ focus ring မြင်ရ — ✅ skip link၊ stage/timeline `tabIndex`၊ Tab ကို workspace အတွင်းမှာသာ ဖမ်း (e2e ၄ ခု) |
| UX-TOP-06 | Settings → Snap/Magnet/Preview quality ပြောင်းရင် ချက်ချင်း သက်ရောက်၊ reload မှာ မှတ်ထား |
| UX-STB-01 | Status bar fields (Project/Resolution/FPS/Duration/Selection)၊ Resolution နှိပ် → Project settings |
| UX-STB-02 | Save Project (Ctrl+S) toast "သိမ်းပြီး ✓"၊ ကျဉ်းရင် fields ဖျောက် |
| UX-GLB-01 | `visibilitychange` မှာ အတင်းသိမ်း (e2e)၊ crash-recovery dialog (flag ဖန်တီးပြီး reload) — ✅ e2e ၂ ခု |
| UX-GLB-02 | Tab နှစ်ခု → ဒုတိယ read-only banner — ✅ (`BroadcastChannel` + takeover) |
| UX-GLB-03 | Window title ● unsaved — ✅ e2e |
