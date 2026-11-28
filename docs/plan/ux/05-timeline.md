# UX Spec · Part 5 — Timeline (CapCut ရဲ့ နှလုံးသား)

**ပြဿနာ (G2, G3, G7, G8)**: right-click menu မရှိ၊ track header က hide/lock ပဲ၊ toolbar မပြည့်စုံ၊ default zoom ၁၀ px/s။ **စံ**: CapCut သုံးဖူးသူက ညွှန်ကြားချက်မပါဘဲ ဖြတ်/ရွှေ့/trim/ဖျက်/ကပ် လုပ်နိုင်ရမယ်။
Engine semantics (command API၊ ripple/roll/slip) = `L3` §၃ (T1–T6) — ဒီ Part က **မြင်ရ/ထိရတဲ့ အပြုအမူ**။

---

## ၅.၁ Anatomy နဲ့ အတိုင်းအတာ

```
┌ TOOLBAR 40px ───────────────────────────────────────────────────────────────────────────────┐
│ ↶ ↷ │ ▸V ✂B │ Split Del Ripple Dup │ Crop Speed │ 🧲P ⌖N ⛓ ⚑M I O │          ─●─ ＋ ⤢Fit ≡ ⚙ │
├──────────────┬──────────────────────────────────────────────────────────────────────────────┤
│ (corner)     │ RULER 28px  00:00 ... 00:05 ... 00:10     ⚑marker   [In═════Out]             │
├──────────────┼──────────────────────────────────────────────────────────────────────────────┤
│ ⋮⋮ 👁 🔒 Text   │ ▓▓ စာတန်း ၁ ▓▓  ▓▓ စာတန်း ၂ ▓▓                                           │ ← lane (M=44)
│ ⋮⋮ 👁 🔒 Text 2 │      ▓▓ overlay စာ ▓▓                                                      │
│ ⋮⋮ 👁 🔒 Overlay│                                                                           │
│ ⋮⋮ 👁 🔒 🧲MAIN │ [▭▭▭▭ video thumbnails ▭▭▭▭][▭▭▭ ▭▭▭]                                     │ ← main (56)
│ ⋮⋮ 👁 🔒 🔊 S Voice│ ▁▂▅▇▅▂▁▁▂▃▅ waveform ▁▂▅▇                                               │
│ ⋮⋮ 👁 🔒 🔊 S Music│ ▁▁▂▂▃▃▂▂▁▁                                                              │
│ ＋ Add track ▾│  ╎ playhead (လိမ္မော်၊ ထိပ်တြိဂံ + timecode bubble)                           │
├──────────────┴──────────────────────────────────────────────────────────────────────────────┤
│ MINIMAP 24px (project > ၁ မိနစ်) ▭▭▭▭▭[viewport]▭▭▭   │ H-scroll 10px                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
| ဒြပ်စင် | အတိုင်းအတာ |
|---|---|
| Toolbar | ၄၀ px |
| Ruler | ၂၈ px (marker row ပါ) |
| Header ကော်လံ | **၁၃၂ px** (resize ၉၆–၂၂၀) |
| Lane အမြင့် | **S ၃၂ · M ၄၄ (default) · L ၆၄**၊ **Main video** M=၅၆ / L=၈၀ (thumbnail) |
| Track အများဆုံး | **၃၀** (ကျော်ရင် toast "Track ၃၀ ထက် မရပါ") |
| Minimap | ၂၄ px |
- **Track အစဉ် (အပေါ်→အောက်)**: Effect/Adjust layers · Text/Caption lanes · Sticker/Overlay lanes · **MAIN video** · Audio (Voice · Music · SFX)။ **အပေါ်ဆုံး lane = ရှေ့ဆုံးပြ (z-order)**။
- **Default project tracks**: `Text` · `Overlay` · **`MAIN`** (video) · `Voice` · `Music` (ကဗျာ workflow အတွက် audio ၂ ခု)။ (လက်ရှိ "Text/Video/Overlay/Audio" ကို ပြောင်း — migration မှာ audio→Voice)။

---

## ၅.၂ Clip visual language

**Zoom-dependent detail** (clip အကျယ်): `<၂၀ px` = အရောင်သာ · `၂၀–၆၀` = icon · `၆၀–၁၂၀` = အမည် · `>၁၂၀` = အမည်+thumbnails/waveform+badges။
| Kind | ပုံစံ | Badge/အပိုင်း |
|---|---|---|
| **Text** | ခရမ်း gradient၊ ပထမစာကြောင်း (**syllable-safe ellipsis**) | Caption: **confidence dot** (အနီ/ဝါ/စိမ်း)၊ 🔒 locked၊ ⚠ font missing |
| **Video** | thumbnail strip (အကျယ်အလိုက် frame ရွေး)၊ အမည် | speed `×၂`၊ ♪ (audio ပါ)၊ ⛓ link၊ ◆ keyframe row |
| **Image** | thumbnail ၁ ပုံ ထပ်ခါထပ်ခါ | |
| **Audio** | waveform (role အရောင် — Voice စိမ်း / Music ခရမ်းစိမ် / SFX ပန်းရောင်)၊ အမည် | **fade handle** (အစ/အဆုံး တြိဂံ)၊ ducking icon၊ loop icon၊ (P2) volume line |
| **Sticker/Shape** | လိမ္မော်၊ icon | |
| **Effect/Adjust/Filter layer** | ပန်းရောင်-ခရမ်း၊ icon+အမည် | |
| **Transition** | boundary ပေါ် အပြာ/ဝါ bow-tie ၂ ဘက် | ကြာချိန်လိုက် အကျယ် |
**State များ**: *hover* = အလင်း +၆%၊ အစွန်း trim bracket ပေါ်၊ **tooltip (၅၀၀ ms)** = အမည် · start–end · dur · speed · source in/out · *selected* = **ဘောင်ဖြူ ၂ px + အပြင် accent ၂ px** · *multi-selected* = အားလုံးတူ + ရေတွက်ဘေ့ချ်(status bar) · *locked track* = hatch pattern + cursor `not-allowed` · *hidden track* = opacity ၃၅% · *offline media* = အနီ hatch + ⚠ · *loading waveform/thumbs* = shimmer · *drag ghost* = opacity .7 + snap guide · *collision* = ghost အနီ။
**Cursor**: body `grab`/`grabbing` · edge `ew-resize` (bracket) · razor tool `✂` crosshair · ruler `col-resize` · fade handle `ew-resize` · keyframe `pointer` · blank `default`။

---

## ၅.၃ Track header (G7)

| ဒြပ်စင် | အပြုအမူ |
|---|---|
| `⋮⋮` drag handle | track ပြန်စီ (visual↔visual၊ audio↔audio မှာပဲ၊ main မရွှေ့) — drop indicator အပြာမျဉ်း |
| 👁 Hide | clip ပျောက် (render မလုပ်)၊ row opacity ၃၅% |
| 🔒 Lock | ရွေး/ရွှေ့/trim/ဖျက် မရ (hatch) |
| 🔊 **Mute** (video-with-audio/audio) | အသံပိတ်၊ waveform မှိန် |
| **S Solo** (audio) | solo track မရှိတာတွေ တိတ် |
| 🧲 **Magnet** (MAIN ပဲ) | ဖွင့်/ပိတ် (P) |
| **အမည်** | double-click rename (Enter/Esc)၊ ≤ ၃၂ လုံး၊ မြန်မာ OK |
| Track ရွေး | header အလွတ်နှိပ် = track ရွေး (Inspector → Track) |
| **Height** | header right-click → S/M/L၊ `Alt+wheel` (P2) |
| **MAIN badge** | main track မှာ "MAIN" |
- S ပုံစံ (၃၂ px) = icon တွေပဲ၊ အမည် tooltip။ **＋ Add track ▾** (header အောက်ဆုံး): *Text · Overlay · Audio (Voice/Music/SFX) · Effect layer*။
- **Delete track**: clip ရှိရင် confirm ("clip ၄ ခု ပါတယ် — Undo ရ")၊ main မဖျက်ရ။

---

## ၅.၄ Toolbar (၄၀ px)

| ခလုတ် | Shortcut | စည်းမျဉ်း |
|---|---|---|
| ↶ Undo · ↷ Redo | Ctrl+Z · Ctrl+Shift+Z | tooltip = command label |
| ▸ **Select** · ✂ **Razor** | V · B | Razor = click clip → playhead မဟုတ်ဘဲ **click နေရာမှာ ဖြတ်** (snap ပါ)၊ Esc/V ထွက် |
| **Split** | Ctrl+B / S | ရွေးထားတာ၊ မရွေးရင် playhead အောက်အားလုံး (L3 T2) |
| **Delete** · **Ripple delete** | Del · Shift+Del | tooltip မှာ ကွာခြားချက် |
| **Duplicate** | Ctrl+D | |
| Crop · Speed · Freeze · Reverse | C · – | clip kind ကိုက်မှ enabled (M3/M5b) |
| **🧲 Magnet** | P | main track toggle (accent=ON) |
| **⌖ Snap** | N | toggle (accent=ON) |
| **⛓ Link / Unlink** | Ctrl+L / Ctrl+Shift+L | ရွေးထားတာ ≥ ၂ ခုမှ |
| **⚑ Marker** | M | playhead မှာ |
| **I / O** | I · O | In/Out မှတ် |
| Zoom − / slider / ＋ / **Fit** | − / + / Shift+Z | slider = logarithmic |
| Track height | – | S/M/L (ခလုတ်ဖြင့် အားလုံးပြောင်း) |
| ≡ Menu/⚙ | – | Auto-follow mode · Ruler format (TC/seconds) · Minimap on/off · Snap threshold |
- Disabled ခလုတ်တိုင်း **အကြောင်းရင်း tooltip** (ဥပမာ Split: "Playhead က clip ထဲမှာမရှိ")။ **ကျဉ်းရင်** (< ၇၂၀ px) အချို့ ⋯ overflow ထဲ။

---

## ၅.၅ Gesture matrix (Select tool)

**ဘုံစည်းမျဉ်း**: drag threshold **၃ px** (အောက် = click)။ ဆွဲနေစဉ် **store မပြင် (ghost သာ)** → drop မှ command ၁ ခု → **undo ၁ ဆင့်**။ `Esc` = ပယ်။ Locked/hidden track = gesture မစ။ Auto-scroll: အစွန်း ၃၀ px ထဲ → ၀–၁၂၀၀ px/s (နီးလေ မြန်လေ)။

| Target | Gesture | Modifier | ရလဒ် | Undo label |
|---|---|---|---|---|
| Clip body | Click | – | ရွေး (တစ်ခုတည်း) | – |
| | Click | Shift/Ctrl | multi toggle | – |
| | **Double-click** | – | Inspector focus; **text = Player ထဲ inline edit** | – |
| | **Drag** (အလျား) | – | **ရွှေ့** (time) + **ဒေါင်လိုက်** lane ကူး (kind တူသော lane/track) | "Move clip" |
| | Drag | **Shift** | snap ပိတ် | |
| | Drag | **Alt** | **Copy ရွှေ့** (duplicate-drag) | "Duplicate clip" |
| | Drag (media) | **Alt (body)** | **Slip** (src in/out ရွှေ့၊ clip မရွှေ့) | "Slip clip" |
| | Drag | **Ctrl+Alt** | **Slide** (clip ရွှေ့+အနီးနားတွေ trim) — P2 | "Slide clip" |
| | Drag (**MAIN + Magnet ON**) | – | **Reorder** (boundary မှာ insert + ripple)၊ drop indicator ▎ | "Reorder clip" |
| | Drag (ရွေး ၂+) | – | အားလုံး **အချိန်ကွာ မပြောင်း** ရွှေ့ | "Move N clips" |
| **Left/Right edge** (၉ px) | Drag | – | **Trim** (start/dur + src.in/out)၊ source အရှည်ထက်မကျော်၊ ကပ်နေတဲ့ clip ကိုမကျော် (collision ရပ်) | "Trim clip" |
| | Drag | **Shift** | **Ripple trim** (နောက်က clip အားလုံးလိုက်) | "Ripple trim" |
| | Drag | **Ctrl** | **Roll** (ကပ်နေတဲ့ ဘယ်clip အဆုံး+ညာclip အစ တစ်ပြိုင်) | "Roll edit" |
| | Text/Image/Sticker | – | **အလွတ်ရှည်လို့ရ** (source မရှိ) | |
| **Audio fade handle** | Drag | – | Fade in/out (၀–၁၀ s)၊ live curve ပြ | "Change fade" |
| **Keyframe ◆** (M3) | Drag / Del / Alt+drag | – | အချိန်ရွှေ့ / ဖျက် / ကူး | "Move keyframe" |
| **Transition** bow-tie | Drag edge | – | ကြာချိန်ပြင် | "Change transition" |
| **Blank lane** | Click | – | deselect + **playhead ကို နေရာ**ရွှေ့ | – |
| | Drag | – | **Marquee** (box select၊ track ကျော်) | – |
| | Space+drag / Middle-drag | – | pan | – |
| **Ruler** | Click / Drag | – | seek / **scrub** (audio scrub ပါ) | – |
| | Alt+Drag | – | **In/Out range** သတ်မှတ် | "Set range" |
| **Playhead handle** | Drag | Shift=snap ပိတ် | scrub (clip edge/marker ကို magnetic) | – |
| **Marker** | Click / Dbl-click / Drag / Del | | seek / rename / ရွှေ့ / ဖျက် | "Move marker" |
| **In/Out handle** | Drag | | range ပြင် (snap) | "Set range" |
| **Track header** | Drag ⋮⋮ / Dbl-click name / icons | | ပြန်စီ / rename / toggle | "Reorder track" |
| **Minimap** | Click/Drag viewport | | scroll | – |
| **Wheel** | – | – | ဒေါင်လိုက် scroll (track များရင်) | – |
| | – | **Shift** | ဘယ်ညာ scroll | – |
| | – | **Ctrl** | **zoom (cursor ဗဟို)** | – |
| Panel → Timeline | Drop | – | Part 2 §၂.၂.၂ | "Add media" |

**Snapping**: point = playhead · clip အစ/အဆုံး (track အားလုံး) · marker · In/Out · (M2) ဖတ်သံ **phrase boundary** · ruler grid။ Threshold **၈ px**၊ **playhead > marker > clip edge** ဦးစားပေး၊ guide = ပန်းရောင်မျဉ်း + "ကပ်" tooltip၊ **Shift = ပိတ်**၊ toolbar ⌖ (N) နဲ့ ပိတ်။ ရလဒ်ကို **frame ကို quantize**။

---

## ၅.၆ Context menus (G2) — ပုံသေ items

**Clip** (ညာနှိပ်):
`Cut Ctrl+X` · `Copy Ctrl+C` · `Paste Ctrl+V` (playhead၊ track တူ) · `Duplicate Ctrl+D` · `Delete Del` · `Delete & close gap Shift+Del`
―
`Split at playhead Ctrl+B` (playhead clip ထဲမှာမှ enabled) · `Split all tracks`
―
`Freeze frame` (video၊ M5b) · `Reverse` (M5b) · `Speed…` (→ Inspector Speed) · `Detach audio` (video+audio ပါမှ)
―
`Link Ctrl+L` / `Unlink` · `Replace media…` · `Copy style Ctrl+Alt+C` / `Paste style Ctrl+Alt+V` · `Save as preset…`
―
`Show in Media panel` · `Properties` (Inspector focus)
**Multi-select**: Cut/Copy/Duplicate/Delete/Ripple/Link/Copy style (သက်ဆိုင်တာပဲ)။ **Text/Caption** အပိုထည့်: `Edit text` · `Mark reviewed` · `Lock/Unlock` · `Snap to voice`။
**Track**: `Add track above/below` · `Rename` · `Height ▸ S/M/L` · `Mute/Unmute` · `Solo` · `Lock/Unlock` · `Hide/Show` · `Move up/down` · `Delete track…`
**Ruler / ဗလာ**: `Add marker here` · `Set In here` · `Set Out here` · `Clear In/Out` · `Paste` · `Zoom to fit` · `Zoom to selection`
**Marker**: `Rename…` · `Colour ▸` · `Delete` · **Transition**: `Duration…` · `Replace` · `Remove` · **Keyframe**: `Easing ▸` · `Delete` · `Copy/Paste`
- Menu: ၂၄၀ ms အတွင်း ပေါ် (instant)၊ keyboard ↑/↓/Enter/Esc၊ disabled item = မီးခိုး + tooltip အကြောင်းရင်း၊ screen ဘောင်ထဲ flip။

---

## ၅.၇ Keyboard (Timeline focus)

| Key | လုပ်ဆောင်ချက် | | Key | လုပ်ဆောင်ချက် |
|---|---|---|---|---|
| Space | play/pause | | Ctrl+A | clip အားလုံးရွေး |
| J / K / L | shuttle နောက်/ရပ်/ရှေ့ (ထပ်နှိပ်=မြန်) | | Esc | deselect/ပယ် |
| ← / → | ၁ frame (Shift = ၁ s) | | Tab / Shift+Tab | track အတွင်း နောက်/ရှေ့ clip ရွေး |
| ↑ / ↓ | ရှေ့/နောက် edit point | | Ctrl+↑/↓ | ရွေးထားတာကို lane အပေါ်/အောက် ရွှေ့ |
| Home / End | အစ/အဆုံး | | **Alt+←/→** | ရွေးထားတာ ၁ frame nudge (Shift = ၁ s) |
| Ctrl+B / S | split | | Ctrl+Alt+←/→ | **trim start** ၁ frame `[A]` |
| Del / Shift+Del | delete / ripple | | Shift+Alt+←/→ | **trim end** ၁ frame `[A]` |
| Q / W | playhead ဘယ်/ညာ ဖျက် | | Alt+→ (ရွေးထားစဉ် Alt+Shift) | select-all-right `[A]` |
| N · P · M | snap · magnet · marker | | I / O · X / Shift+X | In/Out · Lift / Extract |
| B / V | razor / select | | + / − · Shift+Z | zoom · fit |
| Ctrl+C / X / V / D | copy/cut/paste/dup | | \ | loop |

---

## ၅.၈ Zoom · Scroll · Minimap · Follow

| ကဏ္ဍ | စည်းမျဉ်း |
|---|---|
| **Zoom range** | **၅–၆၀၀ px/s** (default **၆၀**)၊ slider = logarithmic၊ 1 frame ≥ ၄ px ရတဲ့အထိ |
| Zoom anchor | wheel = cursor၊ `+/-` = playhead (မမြင်ရရင် viewport အလယ်) |
| Presets | *Frame (၆၀၀) · ၁ s · ၅ s · ၃၀ s · Fit project · Fit selection* |
| **Ruler ticks** | pps ≥ ၃၀၀: frame ticks · ၁၂၀–၃၀၀: ၅ frame · ၆၀–၁၂၀: ၁ s + minor ၁၀ f · ၂၀–၆၀: ၅ s · <၂၀: ၃၀ s/၁ min · label = Settings ရွေးတဲ့ format |
| Scroll | H = custom scrollbar (၁၀ px) + wheel; V = track များရင် (ruler နဲ့ header **sticky**) |
| **Minimap** | project > ၁ မိနစ်ဆို ပြ (Settings)၊ clip = အရောင်ကွက်၊ viewport ဘောင် drag |
| **Follow** | **Auto** (playhead က ညာ ၉၀% ကျော်ရင် ၂၀% သို့ jump) · **Smooth** (ဗဟိုထား) · **Off**။ လက်နဲ့ scroll လုပ်ရင် ၂.၅ s follow ရပ်။ Timeline ပြင်ပ seek → မြင်အောင် scroll |
| **Scrub** | audio **၈၀–၁၅၀ ms** burst (Web Audio)၊ **frame ghosting** (ပုံ မဲမပေါ်)၊ drag > ၃ px |
| Perf | **virtualize** (မျက်နှာပြင်ပေါ်က clip ပဲ)၊ playhead သီးသန့် (transport tick က body မ re-render)၊ waveform LOD |

---

## ၅.၉ Markers · In/Out · Range ops

- **Marker** (M): ruler ပေါ် ⚑ (အရောင် ၆ မျိုး)၊ label၊ **snap point**၊ click = seek၊ double-click rename၊ drag ရွှေ့၊ Del ဖျက်၊ project ထဲ သိမ်း။
- **In/Out** (I/O): ruler မှာ အရိပ်ကွက် + handle (drag/snap)၊ `Alt+X` clear။ **X = Lift** (ကွက်လပ်ချန်)၊ **Shift+X = Extract** (ripple)၊ Loop နဲ့ **Export range** က ဒီ range ကိုသုံး။

---

## ၅.၁၀ MAIN track · Magnet · Lane · Link

- **MAIN (video) + Magnet ON (default — D8)**: ကွက်လပ်မကျန်ရ — ဖျက်/trim/ရွှေ့ရင် နောက်က ကပ်လာ၊ drop = insert၊ OFF = လွတ်လပ်စွာ (overwrite မဟုတ်ဘဲ မထပ်)။ ခလုတ် accent = ON။
- **Overlay/Text lanes**: လွတ်လပ်၊ **collision = lane အသစ်** (အပေါ်မှာ "Text 2")၊ အသစ်ပေါ်ရင် ၆၀၀ ms highlight + toast "Track အသစ်ဖွင့်ပေးပြီး"၊ **အလွတ် lane ကို ၁ s နောက်ရှင်း** (kind တစ်ခုအနည်းဆုံး ၁ lane)။ Lane စီစဉ်ပုံ = z-order (အပေါ်=ရှေ့)၊ ဆွဲကူးရင် z-order ပြောင်း။
- **Audio**: Role အလိုက် (Voice/Music/SFX)၊ import လုပ်တုန်းက role ရှိတဲ့ track ကိုဦးစားပေး။
- **Link ⛓**: clip တွင် icon၊ **move/ripple/split/delete = group**၊ trim = ကိုယ့် clip သာ၊ Link မဖြုတ်ဘဲ တစ်ခုချင်း ရွှေ့ရန် `Alt+drag` မဟုတ် — **Unlink လုပ်ပါ**။ ဖတ်သံ ↔ ထုတ်ထားတဲ့စာတန်း auto-link (Auto-draft ပြီးချိန်)။

---

## ၅.၁၁ State များ

| State | ပုံစံ |
|---|---|
| **Empty timeline** | dashed အကွက်ကြီး + "ဖိုင်ကို ဒီမှာချပါ၊ ဒါမှမဟုတ် Media ကနေ ဆွဲထည့်ပါ" + [Import]၊ drag-over = အပြာ highlight |
| Drop invalid | ghost အနီ + cursor `no-drop` + tooltip |
| Offline media | clip အနီ hatch + ⚠ + [Relink…] (click/right-click) |
| Loading peaks/thumbs | skeleton shimmer (clip အရွယ်မပြောင်း) |
| Big project (> ၅၀၀ clip) | Perf HUD hint "Minimap/low detail mode" auto |
| Error (command rejected) | toast အကြောင်းရင်း (ဥပမာ "Locked track မှာ မရ") |

---

## ၅.၁၂ Accessibility

- Timeline `role="application"` + `aria-label="Timeline"`၊ clip = **roving tabindex** + `aria-label="Text clip 'ကဗျာ…', ၀:၀၃–၀:၀၆, ထရက် Text, ရွေးထား"`။
- **Live region**: "Split clip", "Moved to ၀:၁၂", "Deleted ၃ clips — Undo ရ"။
- Keyboard-only: ရွေး (Tab) → ရွှေ့ (Alt+←/→) → trim (Ctrl/Shift+Alt+←/→) → split (Ctrl+B) → delete → undo ရ။ Focus ring မြင်ရ၊ high-contrast selection (ဖြူ+အပြာ)။

---

## ၅.၁၃ Acceptance (Part 5)

| ID | စစ်ချက် |
|---|---|
| UX-TML-01 | Anatomy/အတိုင်းအတာ (§၅.၁)၊ default tracks Text/Overlay/MAIN/Voice/Music၊ track ≤ ၃၀ |
| UX-TML-02 | Clip visual language ကို zoom အဆင့် ၄ ခုမှာ (color/icon/name/full) မှန်၊ confidence dot၊ ⛓၊ 🔒၊ ⚠၊ speed badge |
| UX-TML-03 | Tooltip ၅၀၀ ms (အမည်/အချိန်/speed/src) |
| UX-TML-04 | Track header: hide/lock/mute/solo/rename/height/reorder/add/delete(confirm)၊ MAIN badge+magnet |
| UX-TML-05 | Toolbar ခလုတ်အားလုံး + disabled-reason tooltip |
| UX-TML-06 | Gesture: move (အလျား+ဒေါင်လိုက် lane)၊ Alt-copy၊ Shift-no-snap၊ multi-move၊ **main reorder** |
| UX-TML-07 | Trim normal/Shift-ripple/Ctrl-roll၊ source-limit၊ collision ရပ်၊ text အလွတ်ရှည်၊ Alt-slip |
| UX-TML-08 | Marquee၊ pan (Space/middle)၊ Ctrl+wheel zoom cursor-anchored၊ Shift+wheel H |
| UX-TML-09 | Ruler scrub (audio scrub)၊ playhead magnetic၊ Alt+drag range၊ In/Out handles |
| UX-TML-10 | Auto-scroll စည်းမျဉ်း (၃၀ px zone)၊ Esc ပယ်၊ drag=undo ၁ ဆင့် |
| UX-TML-11 | **Context menu** clip/multi/text/track/ruler/marker/transition/keyframe (§၅.၆ items အတိုင်း၊ disabled reason) |
| UX-TML-12 | Keyboard table §၅.၇ (Tab/Alt-nudge/trim/Ctrl+↑↓ lane/J-K-L/edit point) |
| UX-TML-13 | Zoom ၅–၆၀၀၊ presets၊ ruler tick scheme၊ minimap၊ follow Auto/Smooth/Off + manual scroll pause |
| UX-TML-14 | Snap points/priority/threshold ၈px/Shift ပိတ်/N toggle |
| UX-TML-15 | Marker (add/rename/move/delete/snap)၊ Lift/Extract |
| UX-TML-16 | **Magnet ON**: delete/trim/drop ripple၊ OFF: မထပ် · **Auto-lane** (collision→lane အသစ်+highlight+toast၊ အလွတ်ရှင်း) |
| UX-TML-17 | Link group (move/ripple/split/delete group, trim တစ်ခုတည်း)၊ Auto-draft ပြီး auto-link |
| UX-TML-18 | States: empty drop zone、invalid drop、offline Relink、loading shimmer、error toast |
| UX-TML-19 | A11y: roving tabindex၊ aria-label၊ live region၊ keyboard-only flow |
| UX-TML-20 | Perf: clip ၁၀၀၀ pan/zoom ≥ ၆၀ fps (virtualize)၊ playhead tick က body re-render မလုပ် |
