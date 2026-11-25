# UX Spec · Part 2 — Tool Rail နဲ့ Left Panels (Asset/Tool panels)

**ပြဿနာ (G3, G4, G5)**: Rail tool ၈ ခုက panel အလွတ်၊ Media tile ကို ဆွဲချလို့မရ၊ demo panel။ **စံ**: Rail နှိပ်တိုင်း အသုံးဝင်တဲ့ panel ပေါ်၊ **click/double-click/drag/hover/right-click** ပေါင်းစုံ CapCut လို။

---

## ၂.၁ Tool Rail

| # | Tool | Icon | Shortcut | အခြေအနေ | Milestone |
|---|---|---|---|---|---|
| 1 | **Media** | film | Alt+1 | ✅ အလုပ်လုပ် (drag/ပြည့်စုံအောင်) | M1 |
| 2 | **Audio** | music | Alt+2 | ပြည့်စုံအောင် | M1/M5 |
| 3 | **Text** | type | Alt+3 | ✅ တိုးချဲ့ | M2 |
| 4 | **Stickers** | smile | Alt+4 | ⏳ | M3/M6 |
| 5 | **Effects** | sparkles | Alt+5 | ⏳ | M4c |
| 6 | **Transitions** | bowtie | Alt+6 | ⏳ | M4b |
| 7 | **Filters** | circles | Alt+7 | ⏳ | M4a |
| 8 | **Adjust** | sliders | Alt+8 | ⏳ | M4a |
| 9 | **Templates** | layout | Alt+9 | ⏳ | M6 |
| 10 | **More** | ⋯ | – | popover (panel မဟုတ်) | M1 |

**စည်းမျဉ်း**
- **မပြည့်စုံသေးတဲ့ tool** = rail မှာ **အမြင့်မပြ** သို့ **"Soon" badge** + နှိပ်ရင် panel အလွတ်မဖွင့်ဘဲ tooltip/toast "M4 မှာ ပါလာမယ်"။ (**ဘာမှမရှိတဲ့ panel ဖွင့်ခိုင်းခြင်း မလုပ်ရ** — P7)
- Active = `--accent-soft` နောက်ခံ + accent2 စာ/icon၊ hover = `--panel2`၊ focus ring။
- **Re-click active tool** = Left panel collapse/expand toggle။
- Tooltip (၂၅၀ ms): "**Media** · ပုံ/ဗီဒီယို/အသံ ဖိုင်များ (Alt+1)"။
- အမြင့်နည်းရင် (< ၇၀၀) label ဖျောက်၊ rail scroll (scrollbar ဝှက်)။ `More` = popover: Settings · Shortcuts · Reset layout · Diagnostics · About/Version · Feedback။
- Tool ပြောင်းတာ **project data ကို မထိ**၊ panel state (search/scroll/tab) ကို tool အလိုက် မှတ်ထား (session အတွင်း)။

---

## ၂.၂ Common Panel component (`AssetPanel`) — Panel အားလုံး ဝေမျှ

```
┌──────────────────────────────┐
│ Media                    [«] │  ← header (title + collapse)
│ Local · Library · Audio · Rec │  ← tabs
│ [🔍 ရှာဖွေ...        ×] [▾ ⇅]│  ← search + filter/sort
│ (All)(Video)(Photo)(Audio)    │  ← chips (horizontal scroll)
│ [Upload Media ▾]   [▦][☰]    │  ← primary action + view toggle
│ ┌────┐ ┌────┐ ┌────┐         │
│ │tile│ │tile│ │tile│  ...    │  ← grid (virtualized)
│ └────┘ └────┘ └────┘         │
│ footer: ၃ ရွေးထား [Add][Del] │  ← selection actions (ရွေးမှပေါ်)
└──────────────────────────────┘
```
**Search**: debounce ၁၅၀ ms · clear × · `Esc` ရှင်း · `/` focus · ရလဒ်အရေအတွက်ပြ · မရှိ = "'{q}' နဲ့ ကိုက်တာ မတွေ့ပါ" + "ရှင်းမယ်" ခလုတ် · match highlight။
**Sort/Filter**: Sort (Recent · Name · Duration · Type)၊ Filter (Used/Unused · Favorites ★)၊ **view grid/list** မှတ်ထား။
**Grid**: min tile ၉၆ px (၃ column @ ၃၃၀)၊ gap ၈၊ **> ၂၀၀ items = virtualize**၊ thumbnail lazy (viewport အနီး)၊ concurrency ၄။

**Tile anatomy**
| ဒြပ်စင် | နေရာ | စည်းမျဉ်း |
|---|---|---|
| Thumbnail / waveform / icon | အလယ် | video = ပထမ frame (၀.၅ s)၊ audio = mini waveform |
| Type icon | ဘယ်ကြော် | video/photo/audio |
| **Duration badge** | ညာအောက် | `00:15` |
| **Used ✓** | ဘယ်အောက် | timeline မှာသုံးထား (အပြာ) |
| **Offline ⚠** | ဘယ်အပေါ် (အနီ) | ဖိုင်ပျောက် → Relink |
| **★ Favorite** | ညာအပေါ် (hover) | toggle |
| **＋ Add** | hover ညာအလယ် | playhead မှာ ထည့် |
| Name | list=ဘေးမှာ၊ grid=hover/ရွေးရင် အောက်မှာ | ellipsis မှာ syllable မကျိုး (P12) |
| Loading | shimmer | layout မရွေ့ |

**Interactions (အားလုံးတူ)**
| လုပ်ဆောင်ချက် | ရလဒ် |
|---|---|
| Click | ရွေး (single)၊ **Shift/Ctrl+click** multi၊ **Ctrl+A** အားလုံး |
| **Double-click** / `Enter` / **＋** | Timeline ပေါ် **playhead မှာ** ထည့် (§၂.၂.၁) |
| **Drag** | Timeline lane / Player / empty timeline area ပေါ်ချ (§၂.၂.၂) |
| Hover (video) | mouse x = scrub preview (thumbnail strip) |
| Hover (audio) | ▶ ပေါ် → နှိပ်ကြား (toggle)၊ **တစ်ကြိမ်တစ်ခုပဲ**၊ progress bar၊ Space = play/pause |
| **Right-click** | Menu: *Add to timeline · Add as overlay · Replace selected clip's media · Favorite · Rename · Select clips using this · Relink… · Remove from project* |
| `Delete` | project ထဲက ဖယ် (သုံးထားရင် confirm "clip ၃ ခု သုံးထား — ဖယ်ရင် ပျောက်မယ်၊ Undo ရ") |
| Arrow keys | grid ကြား ရွှေ့၊ `Home/End` |

### ၂.၂.၁ Add-by-click/double-click စည်းမျဉ်း
- **Track**: ရွေးထားတဲ့ track က kind တူရင် အဲဒီမှာ၊ မဟုတ်ရင် kind အလိုက် default (video/photo → Main video track၊ audio → role အလိုက် audio track၊ overlay ရွေးထားရင် overlay)။
- **အချိန်**: playhead။ **Main track + Magnet ON** = playhead အနီး clip boundary မှာ **insert (နောက်က ကပ်ရွှေ့)**၊ Magnet OFF = overwrite မဟုတ်ဘဲ **မထပ်အောင် နောက်ဆုံးအဆုံးသို့** (S5 lane စည်းမျဉ်း)။ **ထပ်မယ့် overlay/text** = lane အသစ်အလိုအလျောက်။
- ထည့်ပြီး **ထည့်လိုက်တဲ့ clip ကို ရွေး** + playhead ကို clip အစသို့ + Timeline ကို clip မြင်အောင် scroll။ Toast: "ထည့်ပြီး — Undo"။
- Multi-select ထည့်ရင် **အစဉ်လိုက် ဆက်တိုက်**၊ undo ၁ ဆင့်။

### ၂.၂.၂ Drag & Drop စည်းမျဉ်း (G3)
- **Ghost**: thumbnail ၆၄ px + ရေတွက်ဘေ့ချ်၊ opacity .75၊ cursor `grabbing`။
- **Drop targets**
  | Target | ရလဒ် | Indicator |
  |---|---|---|
  | Timeline lane (kind ကိုက်) | အချိန်နေရာမှာ ထည့် | **အပြာ ghost clip + snap guide** |
  | Timeline lane (kind မကိုက်) | **No-drop** (အနီ) | cursor `no-drop` + tooltip "ဒီ track မှာ {kind} မထည့်နိုင်" |
  | Timeline ကွက်လပ်/အောက်ဆုံး | **Track အသစ်ဖွဲ့ပြီး** ထည့် | "＋ New track" အပြာမျဉ်း |
  | Main track clip နှစ်ခုကြား | **Insert** (Magnet ON) | boundary မှာ အပြာ ▎ |
  | Player canvas | overlay အဖြစ် အလယ်မှာ (image/video/sticker)၊ audio = မရ | Player ဘောင် dashed အပြာ |
- **Modifier**: `Ctrl` = Insert ကို အတင်းလုပ် (ripple)၊ `Alt` = Overwrite အတင်း၊ `Shift` = snap ပိတ်၊ `Esc` = ပယ်။
- ဖိုင်ကို OS ကနေ **Panel/Timeline/Player ပေါ် တိုက်ရိုက်ချ** = import + ထည့် (overlay "ဖိုင်ချပါ")။

### ၂.၂.၃ State များ (Panel အားလုံး)
| State | ပုံစံ |
|---|---|
| Loading | skeleton ၆ tile + header ထားပြီး |
| **Empty** | icon + စာတစ်ကြောင်း + **CTA** (ဥပမာ "ဖိုင်တင်ပါ" / "ဖတ်သံ သွင်းပါ") |
| **Error** | ⚠ + အကြောင်းရင်း (မြန်မာ) + **"ထပ်စမ်းမယ်"** + (လိုရင်) "Copy diagnostics" |
| **Offline/403/503** (Library) | "Library ဆာဗာ မချိတ်ရသေးပါ (Cloudflare Access / R2 စစ်ပါ)" |
| Partial | "၁၂ ဖိုင်ထဲက ၂ ခု import မရ — အသေးစိတ်" |

---

## ၂.၃ Panel တစ်ခုချင်းစီ

### ၂.၃.၁ **Media** (M1)
**Tabs**: Local · Library · Audio · Record။
**Local**
- **Upload Media ▾**: *Files…* · *Folder…* (`webkitdirectory`) · drag-drop zone။ လက်ခံ: video (mp4/mov/webm/mkv*) · photo (jpg/png/webp/gif*) · audio (mp3/wav/m4a/aac/ogg/webm)။ (*= browser decode ပံ့ပိုးမှသာ)။
- **Import flow**: ဖိုင်တစ်ခုချင်း **tile ပေါ် progress ring** + Cancel ✕၊ ပြီးရင် thumbnail+duration၊ **ဖိုင်ထပ် (name+size+lastModified)** ဆိုရင် "ပြီးသားဖိုင် — ထပ်ထည့်မလား?" (Skip/Add)၊ **> ၅၀၀ MB** = သတိပေး ("ကြီးလွန်းတယ်၊ ၁၀၈၀p အောက် အကြံပြု")၊ decode မရရင် tile အနီ + အကြောင်းရင်း။
- **Storage**: ဖိုင်ကို project နဲ့တွဲသိမ်း (IndexedDB Blob → M3 မတိုင်ခင် **OPFS**)၊ reload မှာ ပြန်ရွေးစရာမလို။ Panel ရဲ့ footer: "သုံးနေတဲ့ နေရာ ၁၂၀ MB · [မသုံးတာ ရှင်း (၃၀ MB)]"။
- **Media info** (hover tooltip/Properties): အမည်၊ ရှည်ချိန်၊ resolution/fps/codec (video)၊ sample rate/channels (audio)၊ အရွယ်၊ import ရက်။
- **Filters**: All/Video/Photo/Audio · Used/Unused · ★။
**Library (R2)**: Category folders **Music · SFX · BG (Photo/Video) · Logo** (Fonts → Font manager)၊ `/api/library/:type` list (loading/offline/403 state ပေါ်)၊ item ▶ preview (Range stream)၊ **ထည့်တဲ့အခါ ဖိုင်ကို project ထဲ ကူး** (offline နဲ့ project ဆက်အလုပ်ဖြစ်)၊ license footnote "ကိုယ်ပိုင် library — လိုင်စင်ကို ကိုယ်တိုင်စစ်ပါ"၊ search/★။
**Audio** (Media အတွင်း tab): project ထဲက audio အားလုံး (local+library+record+extract) **list view default** + mini waveform + role badge (Voice/Music/SFX)။

**Record (အသံသွင်း) — flow အပြည့်**
| အဆင့် | UI | စည်းမျဉ်း |
|---|---|---|
| idle | "🎙 အသံသွင်းမယ်" ခလုတ်ကြီး | နှိပ် → permission |
| permission | Browser prompt + ကျွန်တော့်စာ "မိုက်ခရိုဖုန်း ခွင့်ပြုပါ" | **ငြင်းရင်**: ရှင်းလင်းချက် (🔒 icon နှိပ်၊ Allow) + "ဖိုင်တင်လမ်းကြောင်း" |
| ready | **Device select** · **level meter** (live) · toggles: Noise suppression / Echo cancel / Auto gain (**default OFF**) · **Count-in 3-2-1** (default ON) · **Record to**: New voice track / Selected track · "Headphone monitor" (OFF, သတိပေး) | device မရှိ = "မိုက်မတွေ့ပါ" |
| counting | ကြီးကြီး ၃…၂…၁ | Esc ပယ် |
| **recording** | အနီ ● + timer + meter + **Pause/Resume** + **Stop** | `R`/`Space` toggle၊ **အမြင့်ဆုံး ၃၀ မိနစ်**၊ **၁၀ s တစ်ခါ chunk ကို OPFS ထဲ သိမ်း** (crash/tab ပိတ်လို့ မပျောက်)၊ Timeline playhead ပြေးမယ် (အရင်အသံတွေ ကြားရ — headphone အကြံ) |
| review | waveform + ▶ + **Keep** · **Redo** · **Trim ends** (အစ/အဆုံးတိတ်ကိုဖြတ်) | Keep = Media+Timeline (playhead မှာ Voice track) |
| error | mic ပြတ်/busy/storage full | အကြောင်းရင်း + လုပ်ရန် |
- **Acceptance**: UX-REC-01…08 (ငြင်း/မရှိ/busy/၃၀ မိနစ်/chunk recovery/count-in/keep/redo)။

### ၂.၃.၂ **Audio** (rail tool) (M1 အစ၊ M5a ပြည့်စုံ)
Tabs: **Music · SFX · Voiceover · Extracted**။ Music/SFX = R2 + local audio (category chips: Calm, Cinematic, Sad, Happy… — R2 folder/ဖိုင်နာမည်ကနေ `[A]`)။ Row (list view): ▶ · name · duration · role badge · ＋။ **Add as** role ကို category အလိုက် (Music→music၊ SFX→sfx)၊ right-click "Add as Voice/Music/SFX"။ **Voiceover** = Record flow ကို shortcut။ **Extracted** = video ကနေ detach လုပ်ထားတာ။ အပေါ်မှာ **"ရွေးထားတဲ့ voice clip ရှိရင် Ducking ဖွင့်ပေးမလား?"** hint (Music ထည့်စဉ်)။

### ၂.၃.၃ **Text** (M2)
Tabs: **Text · Captions · Templates · Fonts**။
- **Text tab**: **＋ Default text** (ခလုတ်ကြီး) + style tile များ (Title / Subtitle / Body / Quote / Lower third / Credits — click = ထည့်)။ Burmese sample စာသားပါ (tile မှာ "မြန်မာစာ နမူနာ")။
- **Captions tab** (ကဗျာ/စာတန်း): ① **Paste poem** textarea (+ **Zawgyi detection banner** — "Zawgyi ဖြစ်နိုင်ပါတယ် [Unicode ပြောင်း][မပြောင်း]"၊ **မမေးဘဲ မပြောင်း**) → `Add lines as clips` · ② **Auto-draft** (voice clip လိုအပ် — မရှိရင် disabled "ဖတ်သံ အရင်ထည့်ပါ") · ③ **Tap-sync** (hold T) · ④ **Import SRT / Export SRT** · ⑤ **Caption list** (row: # · စာသား (inline edit) · start–end (edit) · confidence dot · 🔒 · click = ရွေး+seek) + toolbar: *Split at playhead · Merge next · Shift all ±0.1s · Review next (R) · Lock all reviewed (L)*။ **စာသားကို tool တွေက မပြောင်း (P12)**။
- **Templates tab**: text template grid (animated preview)၊ click = ထည့်။ **Poem Mode ▸** ခလုတ် (wizard — L2 §၃)။
- **Fonts tab = Font Manager** (Part 6 §၆.၆ dialog ကိုလည်း ဖွင့်လို့ရ): list (နာမည် + "မြန်မာစာ နမူနာ" preview)၊ **Import font (.ttf/.otf/.woff2)**၊ R2 Fonts (private)၊ ★ favorite၊ ဖျက်၊ **လိုင်စင်သတိ**။
- Acceptance: UX-TXT-01…12။

### ၂.၃.၄ **Stickers** (M3 shapes/logo၊ M6 အပြည့်)
Tabs: **Shapes · Logos**။ Shapes: rect/rounded/ellipse/line/arrow/star/heart/speech-bubble (fill+stroke Inspector မှာ)။ Logos: R2 `Logo/` + local PNG/SVG/WebP၊ click = overlay clip (default 3 s၊ အလယ်၊ scale 30%)။ Animated sticker = P2။

### ၂.၃.၅ **Effects** (M4c)
- **Categories**: Trending · Basic · Retro · Glitch · Light · Blur (chips)။
- **Tile**: **live preview** (လက်ရှိ Player frame ကို effect နဲ့ tile အရွယ် render၊ hover မှာ animate)၊ ★။
- **Apply**: **ရွေးထားတဲ့ clip ရှိရင်** → clip ရဲ့ `fx[]` ထဲ ထည့် (Inspector Effects tab မှာ param/enable/remove/reorder)၊ **မရွေးထားရင်** → **Effect clip** ကို "Effects track" မှာ playhead မှ ၃ s (အောက်က clip အားလုံးကိုသက်ရောက်)။ Toast "Effect ထည့်ပြီး — Undo"။
- Intensity/params = Inspector ထဲ (panel ထဲမဟုတ်)။

### ၂.၃.၆ **Transitions** (M4b)
- Categories: Basic (Fade, Dissolve) · Slide · Zoom · Wipe · Glitch။ Tile hover = ဥပမာ frame နှစ်ခုနဲ့ loop animate။
- **Apply**: (က) **clip နှစ်ခုကြား boundary ပေါ်ကို drop** (boundary က "＋" အပြာ) · (ခ) playhead ကို boundary အနီး (≤ ၀.၅ s) ထားပြီး click · (ဂ) clip ရွေးပြီး click → ထိပ်/အဆုံး ရွေး popover။ Default **၀.၅ s**၊ Inspector/Timeline ပေါ်က transition အဖြတ်ကို ဆွဲပြီး ကြာချိန်ပြင်။ တူညီ lane ပေါ် ကပ်နေတဲ့ clip နှစ်ခုလိုမှ။

### ၂.၃.၇ **Filters** (M4a)
Categories: Portrait · Landscape · Film · B&W · Vintage · Mood (ကဗျာ — Calm/Warm/Cold…)။ Tile live preview။ Click = ရွေးထားတဲ့ clip (မရွေးရင် **Filter clip** track အပေါ်)၊ **Intensity** (၀–၁၀၀၊ default ၈၀) = tile footer ပေါ်မှာ ချက်ချင်း + Inspector။

### ၂.၃.၈ **Adjust** (M4a)
Left panel = **presets** (Auto-enhance? P3၊ Warm/Cool/Vivid/Soft…) + "**Adjustment layer ဖန်တီး**" ခလုတ် + သိမ်းထားတဲ့ custom preset။ **စလိုက်ဒါအားလုံး Inspector → Adjust tab** (single source of truth): Basic (Brightness · Contrast · Saturation · Temperature · Tint · Highlights · Shadows · Fade) · Color (HSL ၈ ဖြာ) · Effects (Sharpen · Vignette · Grain)၊ ↺ reset၊ "Save as preset"။ Apply to: selected clip / adjustment layer (track အပေါ်)။

### ၂.၃.၉ **Templates** (M6)
Tabs: **Project · Text · My templates**။ Card = animated mock preview + နာမည် + duration/ratio။ **Use template** → dialog: "လက်ရှိ project ထဲ ထည့်/Project အသစ်" + **placeholder ဖြည့်** (ကဗျာနာမည်/ရေးသူ/ဖတ်သူ၊ ဖတ်သံဖိုင်ရွေး၊ နောက်ခံရွေး)။ **Save as template** (လက်ရှိ project ကို — media မပါ၊ style/layout/animation သာ)။ **Poem templates ၅ ခု** (Elegant, Night, Boxed, Minimal, Credits-end)။

### ၂.၃.၁၀ **More** (popover)
Settings · Keyboard shortcuts · Reset layout · Diagnostics (Copy) · About/Version/Changelog · Feedback။

---

## ၂.၄ Data flow (Panel ↔ Project)

- **Project media bin** = `project.assets` (project နဲ့တွဲ၊ OPFS/IDB)။ **Media panel = bin ကိုပြ**၊ **Library = R2** (ထည့်မှ bin ထဲကူး)။
- Panel က project ကို **commands (`addMedia`, `addEffect`, `applyTransition` …) ခေါ်ပြီးသာ** ပြောင်း (UI က store ကို တိုက်ရိုက်မပြင်)။
- **Panel registry** (`panels/registry.js`): `{ id, icon, label, tooltip, milestone, ready, component }` — `ready=false` ဆိုရင် rail မှာ "Soon"။

---

## ၂.၅ Acceptance (Part 2)

| ID | စစ်ချက် |
|---|---|
| UX-RAIL-01 | Rail ၁၀ ခု၊ မပြည့်စုံတာ "Soon"/hidden — **panel အလွတ်ဖွင့်လို့မရ** |
| UX-RAIL-02 | Alt+1…9၊ re-click = collapse/expand၊ tooltip (EN+MY+shortcut) |
| UX-PNL-01 | Search debounce/clear/Esc//، sort/filter/view toggle မှတ်ထား |
| UX-PNL-02 | Tile anatomy (duration/used/offline/★/＋)၊ virtualize (၅၀၀ item ၆၀ fps scroll) |
| UX-PNL-03 | Double-click/＋ → playhead မှာ ထည့် (track/magnet စည်းမျဉ်း §၂.၂.၁)၊ Undo ၁ ဆင့် |
| **UX-DND-01** | **Media tile → Timeline lane ဆွဲချ** (ghost, drop indicator, snap) — kind မကိုက်ရင် no-drop |
| UX-DND-02 | Timeline ကွက်လပ်ချ = track အသစ်၊ main track boundary ချ = insert (Magnet ON) |
| UX-DND-03 | OS ဖိုင်ကို panel/timeline/player ပေါ်ချ = import+ထည့်၊ Esc ပယ် |
| UX-MED-01…06 | Import (files/folder/drag)၊ progress+cancel၊ duplicate prompt၊ >၅၀၀MB သတိ၊ decode error tile၊ unused ရှင်း |
| UX-MED-07 | Library: loading/offline/403/empty state များ၊ ထည့်ရင် project ထဲကူး |
| UX-REC-01…08 | Record flow (permission ငြင်း/မရှိ/busy၊ count-in၊ pause/resume၊ ၃၀ မိနစ်၊ chunk recovery၊ keep/redo/trim) — Chromium `--use-fake-device-for-media-stream` ဖြင့် e2e |
| UX-AUD-01 | Audio panel role အလိုက် add၊ Ducking hint |
| UX-TXT-01…12 | Default text/preset tiles၊ Captions (paste→lines, Zawgyi banner မပြောင်းဘဲမေး, Auto-draft disabled-reason, Tap-sync, SRT in/out, caption list inline edit/confidence/lock, split/merge/shift)၊ Font manager |
| UX-STK-01 · UX-FXP-01 · UX-TRN-01 · UX-FLT-01 · UX-ADJ-01 · UX-TPL-01 | panel တစ်ခုချင်း apply/live-preview/undo (M3–M6 မှာ အသက်ဝင်) |
