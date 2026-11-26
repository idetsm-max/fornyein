# UX Spec · Part 3 — Player (Canvas၊ Selection၊ Transform၊ Guides၊ Inline text edit၊ Transport)

**ပြဿနာ (G9, G10, G12)**: handle ၈ ခုရှိပေမဲ့ scale/rotate/crop အပြည့်မသေချာ၊ snap guide/safe-area/canvas zoom/ratio-background controls မရှိ၊ zoom select က top bar မှာ။ **စံ**: CapCut လို **Player ပေါ်မှာ တိုက်ရိုက်ဆွဲ**ပြီး ရှာမှုလွယ်။

---

## ၃.၁ Anatomy

```
┌──────────────────────────────────── PLAYER ────────────────────────────────────┐
│ (letterbox)   ┌──────────── frame (project ratio) ────────────┐                │
│               │  guides: safe-area / grid / center            │                │
│               │      ┌ floating toolbar ┐                     │                │
│               │      └──────────────────┘                     │                │
│               │     ●──────●──────●   ← selection box + 8 handles + ⟲ rotate   │
│               │     │  ကဗျာ ခေါင်းစဉ်  │   snap guides (pink)                   │
│               │     ●──────●──────●   size/angle badge while dragging          │
│               └────────────────────────────────────────────────┘                │
│ 00:00:12:15 / 00:00:30:00   ⏮ ▶ ⏭  ⟳loop  🔊──   [Fit▾] [16:9▾] [▦▾] [Auto▾] ⛶ │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- Frame ကို container ထဲ **Fit** (letterbox `--page` ပိုမှောင်)၊ padding ၁၄၊ ဘောင် radius ၆၊ shadow။ Overlay (selection/guides/editor) = **DOM layer** (canvas မဟုတ်)၊ canvas ပေါ် pointer-events ထိန်း။

---

## ၃.၂ Canvas coordinate/zoom/pan

| ကဏ္ဍ | စည်းမျဉ်း |
|---|---|
| Coordinate | project pixel (e.g. 1920×1080)၊ clip နေရာ = % (aspect ပြောင်းလည်း ထိန်း) |
| **Canvas zoom** | **Fit (default)** · 25 · 50 · 100 · 200 · 400 % (controls bar dropdown + `Ctrl+wheel` cursor ဗဟို + `Ctrl+0` fit + `Ctrl+1` 100%) |
| **Pan** | zoom > Fit ဖြစ်မှ — `Space+drag` / middle-drag / wheel (vertical) / Shift+wheel (horizontal)၊ cursor `grab` |
| Zoom ကိစ္စ | selection box/handle အရွယ်က **screen px မှာ ပုံသေ** (ချဲ့လည်း handle မကြီး) |
| Reset | double-click ဗလာနေရာ = Fit |

---

## ၃.၃ Selection model (Player ပေါ်)

| လုပ်ဆောင်ချက် | ရလဒ် |
|---|---|
| **Click** | **လက်ရှိ frame မှာ မြင်ရတဲ့ ထိပ်ဆုံး clip** ရွေး (z-order = lane/track အပေါ်ဆုံး)၊ Timeline မှာလည်း ထပ်တူရွေးပြ + Inspector ပြောင်း |
| **Alt+click** | နောက်ထပ် အောက်က clip ရွေး (လည်ပတ်) |
| **Shift/Ctrl+click** | multi-select ထည့်/ဖယ် |
| **Click ဗလာ** | deselect |
| **Drag ဗလာ** (marquee) | box ထိတဲ့ clip များ ရွေး (P1) |
| **Locked track** | ရွေးမရ (click ကျော်သွား)၊ hover = tooltip "ထရက် လော့ခ်ထားတယ်" |
| **Hidden track** | ရွေးမရ |
| **အချိန်ပြင်ပ clip** | မြင်ရတာပဲ ရွေးလို့ရ (Timeline ကနေရွေးရင် playhead ကို clip ဆီ **မရွှေ့** — မြင်ရဖို့ "Show at playhead" ခလုတ်) |
- **Hit-test**: bounding rect (rotate ပါ)၊ text = text box၊ **pixel-accurate** (alpha) = P2။
- **Selection visuals**: ဘောင် ၁.၅ px ဖြူ + အပြင် ၁ px `--accent`၊ **handle ၈ ခု** (၉ px ဖြူ၊ accent ဘောင်၊ ပတ်ဝန်းကျင်)၊ **⟲ rotate handle** (အပေါ်အလယ်က ၂၈ px အပြင်ဘက်)၊ **multi-select** = group box။ Effect/Adjust clip ရွေးရင် frame တစ်ခုလုံး dashed ဘောင်။

---

## ၃.၄ Transform စည်းမျဉ်း (clip အမျိုးအစားအလိုက်)

| Handle/Gesture | Text | Video / Image / Sticker / Shape |
|---|---|---|
| **Body drag** | ရွှေ့ (**Shift = axis lock** ၄ px ကျော်ပြီးနောက်) | ရွှေ့ |
| **Corner** | **uniform scale** (`transform.scale`၊ keyframable)၊ `Alt` = ဗဟိုကို pivot | uniform scale၊ `Shift` = free (non-uniform)၊ `Alt` = ဗဟို pivot |
| **Edge-mid (ဘယ်/ညာ)** | **စာဘောင်အကျယ် (wrap width)** ပြောင်း → စာ reflow | single-axis scale (non-uniform) |
| **Edge-mid (အပေါ်/အောက်)** | – | single-axis scale |
| **⟲ Rotate** | လှည့် (`Shift` = ၁၅° snap၊ ၄၅° အနီး magnetic ±၃°) | တူ |
| **Arrow keys** | ၁ px nudge (Shift ၁၀ px) | တူ |
| **Double-click** | **Inline text edit** (§၃.၆) | Crop mode ဝင် |
| **Crop mode** (`C` / Inspector→Crop / floating toolbar) | – | handle တွေက **crop handle** (L-အကွက်)၊ အပြင်ဘက် မှိန်၊ edge ဆွဲ = crop၊ အတွင်းဆွဲ = ပုံကိုရွှေ့၊ **ratio preset** (Free·1:1·16:9·9:16·4:5)၊ `Enter` ပြီး၊ `Esc` ပယ် |
- Drag/rotate/scale တစ်ခုလုံး = **undo ၁ ဆင့်**၊ ဆွဲနေစဉ် **badge**: ရွှေ့ = `X 960 · Y 540`၊ scale = `W×H` / `၁၂၀%`၊ rotate = `၃၀°`။ Keyframe ◆ ဖွင့်ထားရင် (M3) လက်ရှိ playhead မှာ key အလိုအလျောက်ထည့် (Inspector မှာ ဆွဲတာလည်း တူ)။
- Text ရဲ့ font **size** (Inspector) နဲ့ **scale** (handle) က ကွဲ — size = စာလုံးအရွယ် (layout/wrap အတွက်)၊ scale = ပြီးဆုံးပုံရဲ့ အကြီးအသေး။

---

## ၃.၅ Snap + Guides (G10)

| Snap target | Guide | မှတ်ချက် |
|---|---|---|
| Canvas center (V/H) | ပန်းရောင်မျဉ်း | tolerance **၆ screen px** |
| Canvas edge/margin | ပန်းရောင် | |
| **Safe-area** (toggle) | dashed အဝါ | ၉:၁၆: အပေါ် ၁၀% · အောက် ၂၂% · ညာ ၁၄%၊ ၁၆:၉: title-safe ၉၀% / action-safe ၉၅%၊ ၄:၅: ၉၅% |
| အခြား clip အနား/ဗဟို (frame မှာမြင်ရတာ) | ပန်းရောင် | |
| **Grid** (3×3/4×4 toggle) | အဖြူပါး | snap လည်းလုပ် |
| (P2) equal-spacing | အကွာအဝေး label | |
- `Shift` = snap ပိတ် (ခဏ)၊ Settings → Snap threshold။ Guides menu (▦▾): Safe-area · Grid 3×3 · Grid 4×4 · Center cross · **Hide overlay (G)** (UI ဖျောက်ပြီး frame သန့်ကြည့်)။ Safe-area မှာ **ကျော်သွားတဲ့ စာ** ကို selection ပေါ် ⚠ (အဝါ) ("စာ safe-area ထဲမကျ")။

---

## ၃.၆ Inline text editing (မြန်မာ IME ပါ)

| ကဏ္ဍ | စည်းမျဉ်း |
|---|---|
| ဝင် | **Double-click** စာ / `Enter` (ရွေးထားရင်) / floating ✎ |
| ပုံစံ | စာဘောင် dashed၊ canvas စာ ဖျောက် (ထပ်မနေအောင်)၊ **DOM textarea/contenteditable** ကို အတူတူ font/size/rotate နဲ့ ဘောင်ပေါ်တင် |
| **IME** | `compositionstart/update/end` ကာလအတွင်း **re-render/undo-commit မလုပ်** (မြန်မာ keyboard (Myanmar3/Pyidaungsu/Zawgyi-Unicode IME) မပြတ်)၊ `compositionend` မှ commit |
| Caret | browser grapheme/syllable အတိုင်း (သရ/သတ်ကြားမဖြတ်)၊ ←/→ ပတ်ဝန်းကျင်စမ်းသပ် (UX-PLY-12) |
| Keys | `Enter` = စာကြောင်းသစ်၊ **`Ctrl+Enter`/`Esc`/ဘောင်အပြင်click = commit**၊ `Ctrl+A` အားလုံးရွေး |
| Paste | **plain text သာ**၊ Zawgyi ဖြစ်နိုင်ရင် non-blocking banner (မပြောင်းဘဲမေး) |
| Mini toolbar | edit နေစဉ် အပေါ်မှာ: Font ▾ · Size · Color · B/I/U · Align (Inspector နဲ့ ထပ်တူ) |
| Undo | edit အတွင်း browser text-undo၊ **ထွက်ချိန် ၁ undo step** ("Edit text")၊ အလွတ်ဖြစ်ရင် clip ဖျက်မလား မေးမဟုတ် — `Esc` ပယ်ရင် မူရင်းပြန် |
| ကန့်သတ် | ၅၀၀ လုံး/clip၊ ပိုရင် ဖြတ်+toast |
| Auto-size | ပုံမှန် = အကျယ်ကို wrap width နဲ့ ထိန်း၊ စာကြောင်းအရေအတွက်ပေါ် အမြင့်ကြီး |

---

## ၃.၇ Floating toolbar

| Clip | ခလုတ်များ |
|---|---|
| Text | ✎ Edit · ⧉ Duplicate · 🗑 Delete · ⋯ (Copy style · Paste style · Split at playhead · Link/Unlink) |
| Video/Image | ⛶ Crop · ⇋ Flip H · ⇅ Flip V · ⟲ Rotate 90° · ◐ Mask (M4) · ⇄ Replace · ⧉ · 🗑 · ⋯ |
| Sticker/Shape | ⇋ · ⇅ · ⧉ · 🗑 |
- ရွေးထားတဲ့ box အပေါ် **၁၄ px** (နေရာမလောက်ရင် အောက်ကို flip)၊ **Player ဘောင်ထဲ clamp**၊ **ဆွဲ/ချဲ့နေစဉ် ဖျောက်**၊ ပုံသေ icon ၃၀ px၊ tooltip+shortcut။ keyboard: `.` (period) = toolbar ပေါ် focus။

---

## ၃.၈ Transport / Controls bar

| ဒြပ်စင် | အပြုအမူ | Shortcut |
|---|---|---|
| **Timecode** `00:00:12:15 / 00:00:30:00` | **နှိပ်ရင် edit** (`HH:MM:SS:FF` သို့ `12.5` စက္ကန့်) → Enter jump၊ Esc ပယ် | – |
| ⏮ / ⏭ | **ရှေ့/နောက် edit point** (clip အစ/အဆုံး/marker) | ↑ / ↓ |
| ▶/⏸ | play/pause | Space |
| ⟳ Loop | လက်ရှိ In/Out သို့ project အကုန် loop | `\` |
| 🔊 Volume | **preview master** (export မထိ)၊ mute | Alt+M |
| **Canvas ▾** | **Zoom** (Fit/25…400) | Ctrl+0/1 |
| **Ratio ▾** | 16:9 · 9:16 · 1:1 · 4:5 · **Custom…** (W×H) + **Background** (Fit/Fill/Blur-fill/Colour) | – |
| **▦ Guides ▾** | Safe-area · Grid · Center · Hide overlay | G |
| **Quality ▾** | Auto · Full · ½ · ¼ (Auto = badge) | – |
| ⛶ Fullscreen | | F |
- အကျဉ်းချုပ်: Player အကျယ် < ၄၈၀ ဆိုရင် Canvas/Ratio/Guides/Quality ကို **⋯ overflow menu** ထဲ။
- Play ရောက်ဆုံးမှာ ရပ် (Loop ON မှ ပြန်စ)၊ **seek လုပ်နေစဉ် play ဆက်**၊ audio clock = master (S4)၊ **scrub** မှာ အသံတို + **frame ghosting**။

### ၃.၈.၁ Ratio / Canvas ပြောင်းရင်
- Ratio ရွေးတာ **ချက်ချင်းသက်ရောက်** (undo ၁ ဆင့်)၊ **clip နေရာ = %** မို့ layout လိုက်။
- Media clip: **fit baseline** ပြန်တွက် (Fit mode = canvas ထဲဝင်၊ Fill = canvas ပြည့်၊ custom scale = fit baseline ကို မူတည်ထိန်း)။
- **Text size**: ratio ပြောင်းပြီး ကွာလွန်းရင် toast "စာအရွယ်ကို အချိုးအစားနဲ့ ညှိမလား? [ညှိ][မညှိ]"။
- **Background** (media မပြည့်တဲ့နေရာ): Colour (ရွေး) · **Blur-fill** (main video ရဲ့ မှုန်ထားတဲ့မိတ္တူ) · Image။ Project settings (Part 6) မှာ သိမ်း။

---

## ၃.၉ Player state များ

| State | ပုံစံ |
|---|---|
| **Empty project** | frame မှိန် + စာ "Media ကို Timeline ပေါ်ဆွဲထည့်ပါ၊ ဒါမှမဟုတ် **Text → Add text**" + [＋ Import] |
| Loading/Decode (> ၃၀၀ ms) | overlay spinner "Frame ဖတ်နေ…"၊ ပုံမပျောက်၊ UI မပိတ် |
| **Media missing/decode error** | checker pattern + ⚠ "ဖိုင်ပျောက်/ဖတ်မရ" + **[Relink…]** |
| **Font missing** | selection ပေါ် ⚠ badge "Font မဖွင့်နိုင် — fallback သုံးထား" |
| GPU/WebGL lost (M3+) | toast + Canvas2D fallback |
| Export နေစဉ် | Player ကို "Export နေပါတယ်" overlay (preview ရပ်၊ တည်းဖြတ်မပိတ်) |

---

## ၃.၁၀ Performance & Quality

- **Auto quality**: frame budget ၃၃ ms (၃၀ fps)၊ ၁၀ frame ဆက်နှေးရင် Full→½→¼ (badge)၊ ၆၀ frame ကောင်းရင် တစ်ဆင့်တက်။ **scrub/drag** အတွင်း ½ ပြီး ဖြန့်လွှတ်မှ Full။
- Selection overlay = DOM (pointermove ကို rAF နဲ့ coalesce)၊ clip မရွှေ့ရင် canvas မပြန်ဆွဲ။ စာ rasterize cache (font/size/text မပြောင်းရင်)။
- Perf HUD (Settings): fps · render ms · dropped frames။

---

## ၃.၁၁ Acceptance (Part 3)

| ID | စစ်ချက် |
|---|---|
| UX-PLY-01 | Click = ထိပ်ဆုံးclip ရွေး၊ Timeline+Inspector ထပ်တူ၊ Alt+click cycle၊ ဗလာ=deselect၊ locked/hidden ရွေးမရ |
| UX-PLY-02 | Corner/edge/rotate/move handle ၈+၁ ခု **text နဲ့ media နှစ်မျိုးလုံး** မှန် (§၃.၄ ဇယား)၊ badge ပြ၊ undo ၁ ဆင့် |
| UX-PLY-03 | Shift axis-lock / free scale / ၁၅° rotate snap / Alt pivot |
| UX-PLY-04 | Snap guides (center/edge/safe/clip/grid)၊ tolerance ၆px၊ Shift ပိတ်၊ safe-area ကျော်စာ ⚠ |
| UX-PLY-05 | Canvas zoom (dropdown/Ctrl+wheel/Ctrl+0/1)၊ pan (Space+drag)၊ handle screen-px ပုံသေ |
| UX-PLY-06 | Crop mode (C): crop/ပုံရွှေ့/ratio preset/Enter/Esc |
| UX-PLY-07 | Floating toolbar နေရာ (flip/clamp)၊ ဆွဲနေစဉ်ဖျောက်၊ ခလုတ်များ အလုပ်လုပ် |
| UX-PLY-08 | Transport: timecode edit၊ prev/next edit point၊ Loop၊ volume (preview သာ)၊ overflow menu (<၄၈၀) |
| UX-PLY-09 | Ratio ပြောင်း = layout %၊ fit baseline၊ text-size toast၊ Background (Colour/Blur-fill) |
| UX-PLY-10 | State များ (empty/loading/missing/font-missing/export overlay) ပေါ် |
| UX-PLY-11 | Auto quality ↓↑ (frame budget mock) + scrub မှာ ½ |
| **UX-PLY-12** | **Inline text edit**: double-click ဝင်/ထွက်၊ **မြန်မာ IME composition မပြတ်** (CDP `Input.imeSetComposition`)၊ caret သရ/သတ်မဖြတ်၊ ၁ undo step၊ Esc ပယ်၊ ၅၀၀ ကန့်သတ် |
| UX-PLY-13 | Paste plain-text + Zawgyi banner (မပြောင်းဘဲမေး) |
| UX-PLY-14 | Keyboard: arrow nudge၊ `C`၊ `G`၊ `F`၊ `Enter`/`Esc` |
