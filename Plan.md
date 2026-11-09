# ForNyein — တည်ဆောက်မှု အစီအစဉ် (Plan.md)

ဒီဖိုင်ဟာ **တစ်ခုတည်းသော အစီအစဉ်** ဖြစ်ပါတယ်။ chat memory မရှိတဲ့အတွက် session အသစ်တိုင်း ဒီဖိုင်ကို အရင်ဖတ်ပြီးမှ ဆက်လုပ်ပါ။
အဆင့်တစ်ခု ပြီးတိုင်း ဒီဖိုင်ရဲ့ **§2 လက်ရှိအခြေအနေ** နဲ့ **§9 ဆုံးဖြတ်ချက်မှတ်တမ်း** ကို update လုပ်ပါ။

---

## ၁။ ရည်ရွယ်ချက်

မြန်မာကဗျာ ဖတ်သံ/ဗီဒီယိုကို **CapCut လို အလုပ်လုပ်ပုံ** (Track → Clip၊ split/trim/ရွှေ့/ဖျက်/ကပ်၊ ညာဘက် Inspector) နဲ့ **ကိုယ်ပိုင် UI** (VidPro နမူနာအတိုင်း) ပါတဲ့ editor တစ်ခု၊ Browser ထဲမှာပဲ MP4 ထုတ်ပေးနိုင်ရမယ်။

**"ပြီးပြီ" ဆိုတာ ဒီအချက်တွေ အားလုံး မှန်တာ**
1. ကဗျာတစ်ပုဒ် (ဖတ်သံ audio + စာသား) ကို ထည့်၊ စာတန်းတွေကို ချိန်ကိုက်၊ စာပုံစံ/animation ပြင်၊ Music/နောက်ခံ ထည့်ပြီး **MP4 ထုတ်လို့ရ** — အသံ၊ ပုံ ကိုက်ညီ၊ မြန်မာစာ မှန်။
2. Page ပြန် reload လုပ်ရင် project မပျောက် (ဖိုင်တွေပါ ပြန်ပေါ်)။
3. ဖြတ်၊ ဖျက်၊ undo/redo တိုင်း မကျိုး။
4. Chrome/Edge (desktop) မှာ တည်ငြိမ်၊ preview ချောမွေ့။
5. ကိုယ်ပိုင် font (R2 private) သုံးလို့ရ။

---

## ၂။ လက်ရှိအခြေအနေ (နောက်ဆုံး update: Nov 2026)

| အပိုင်း | အခြေအနေ |
|---|---|
| **v1 (`/app`)** | အလုပ်လုပ်ပေမဲ့ patch တွေ ပေါင်းထားတဲ့ ကုဒ်။ **အဆင့် ၇ မှာ အစားထိုးပြီး ဖျက်မယ်။** အခုထိ ထိမထား |
| **v2 Phase 0 (Shell)** | ✅ Deploy ပြီး (`/v2/`)၊ သင့် screenshot နဲ့ စစ်ပြီး — layout/အရောင် နမူနာနဲ့ ကိုက်၊ dark/light ရ |
| **v2 Phase 1 (Engine core)** | ✅ GitHub `main` သို့ တင်ပြီး။ Project store/undo-redo, IndexedDB autosave, Canvas renderer, transport, Text tool, poem lines, Inspector, real Player/Timeline ပါဝင်။ Integration bug ပြင်ပြီး local JS syntax + headless Chromium boot smoke test အောင်မြင် |
| **v2 Phase 2 (Timeline)** | ✅ clip drag/move, edge trim, split, delete/ripple delete, snap toggle, Shift/Ctrl multi-select, keyboard shortcuts, zoom ပါဝင်။ Unit tests ၄/၄ နှင့် headless boot smoke test အောင်မြင်; user စစ်ဆေးပြီး |
| **v2 Phase 3 (Media + Audio)** | ✅ Local import → IndexedDB Blob, audio metadata/waveform, audio clip, gain/fade/loop Inspector, local media preview, R2 Music library UI, microphone recording UI နှင့် basic audio preview controller ထည့်ပြီး။ Syntax/unit/boot smoke test အောင်မြင် |
| **v2 Phase 4 (Text core + poem workflow)** | ✅ fill/fill2 gradient, stroke, shadow/glow, effect ၁၅ ခု, In/Out/Loop animation, per-clip font/style, Myanmar text rendering, resize/rotate handles, double-click edit focus, tap-sync, VAD auto-draft + confidence, review/lock/manual correction, split/merge caption tools, SRT export, Zawgyi→Unicode normalization, Typewriter/Word reveal နှင့် Title/Credits/Quote/Lower-third/Karaoke presets ပြီးစီး။ Unit tests ၉/၉ နှင့် boot smoke test အောင်မြင် |
| **v2 Phase 5 (Audio Mixer + Visual effects)** | ⚙️ Web Audio graph၊ clip/track Volume၊ Pan၊ 3-band EQ၊ Compressor၊ Echo၊ ConvolverNode Reverb၊ Ducking၊ master limiter၊ analyser meter၊ DSP bypass၊ Fade/Slide transitions နှင့် visual brightness/contrast/saturation/blur utility + Inspector controls ထည့်ပြီး။ Unit tests ၁၄/၁၄ နှင့် boot smoke test အောင်မြင်; SE/R2 browser flow, video/photo renderer filters နှင့် overlay logo ဆက်လုပ်ရန် ကျန် |
| Auto caption (ASR) | ⏸ ရပ်ထား။ Cloudflare Workers AI Whisper က မြန်မာအတွက် သုံးမရ (တခြားစာလုံး ထွက်) |
| Cloudflare Access | ⏸ မဖွင့်ရသေး (AUD tag မရှိသေး) — `/api/*` အားလုံး public |
| `local-asr/` (ကိုယ့်ကွန်ပျူတာ Whisper server) | ပြင်ဆင်ထား၊ မစမ်းရသေး |

---

## ၃။ အလုပ်လုပ်မယ့် နည်းလမ်း (ဒါကို တိတိကျကျ လိုက်နာမယ်)

1. **အဆင့်တစ်ခုချင်း push → သင်စစ် → နောက်တစ်ဆင့်။** "အကုန်ပြီးမှ စမ်း" မလုပ်ဘူး။
2. **ကျွန်တော် push မလုပ်ခင်** sandbox ထဲမှာ အလိုအလျောက်စမ်းစစ်မှု (node syntax check + headless Chromium e2e: ခလုတ်နှိပ်၊ စာရိုက်၊ undo၊ reload၊ screenshot) ကို run ပြီး အမှားမရှိမှ တင်မယ်။ စမ်းစစ်မှု script တွေကို `tests/` ထဲ ထည့်ထားမယ်။
3. **သင့်ဘက်က** အစစ် Chrome မှာ စစ်ပြီး screenshot / error စာသား ပို့ — ကျွန်တော် browser အစစ်ကို မမြင်နိုင်လို့ ဒါက မရှိမဖြစ်။
4. အဆင့်တိုင်းမှာ **လက်ခံစစ်ဆေးချက်စာရင်း (Acceptance checklist)** ရှိမယ် (§5)။ အားလုံး ✓ မှ ပြီးတယ်လို့ သတ်မှတ်မယ်။
5. `/v2/` မှာပဲ ဆောက်မယ်၊ **အဆင့် ၇ မပြီးမချင်း `/app` (v1) ကို မဖျက်ဘူး** (အလုပ်လုပ်နေတာကို မဆုံးရှုံးအောင်)။
6. ဖိုင်တစ်ခုကို ~၃၀၀ လိုင်းအောက် module သေးသေးလေးတွေနဲ့ ရေး (ကျိုးရင် ရှာလွယ်အောင်)။
7. Binary ဖိုင် (font၊ ပုံ) ကို GitHub connector နဲ့ မတင်နိုင်လို့ သင်ကိုယ်တိုင် R2 / GitHub web မှာ တင်ရမယ်။

---

## ၄။ ဖွဲ့စည်းပုံ (Architecture)

### ၄.၁ Tech
- Build tool မရှိ (Cloudflare Workers static assets က `public/` ကို တိုက်ရိုက်ပေး)။ Native ES modules။
- UI: **Preact + htm** (jsDelivr မှာ version ပုံသေ)၊ icon = inline SVG၊ စာလုံးအားလုံး `ui/strings.js` တစ်နေရာထဲ။
- Preview/Export: **Canvas 2D** (`drawFrame` တစ်ခုတည်း)၊ **Web Audio**၊ MP4 = **Mediabunny** (WebCodecs)။
- သိမ်းဆည်း: **IndexedDB** (project JSON + import လုပ်ထားတဲ့ media Blob)။ Library = **R2 (private)**။
- Worker (`worker/src/index.ts`): `/api/library/:type`၊ `/api/asset/:type/:name`၊ `/api/presets`၊ `/api/transcribe` (ASR၊ ရပ်ထား)၊ Cloudflare Access JWT စစ် (AUD ထည့်မှ ဖွင့်)။

### ၄.၂ ဖိုင်အစီအစဉ် (`public/v2/`)
```
index.html  main.js  styles.css  editor.css
engine/   model.js store.js storage.js transport.js render.js fonts.js actions.js        (ရှိပြီး)
          timeline.js (clip ops)  media.js  audio.js  export.js  myanmar.js  captions.js  (နောက်ပိုင်း)
ui/       deps.js icons.js strings.js widgets.js hooks.js chrome.js panels.js stage.js   (ရှိပြီး)
tests/    unit/*.mjs  e2e/*.js  harness.md
```

### ၄.၃ Project model (JSON v3)
```
project = { version:3, id, name, size:'16:9|9:16|1:1|4:5', fps:30, tracks:[track], markers:[], media:{ <id>: {name,kind,dur,src:{type:'idb'|'r2',key}} } }
track   = { id, kind:'text'|'video'|'overlay'|'audio', name, hidden, locked, muted, clips:[clip] }
clip    = { id, kind, start, dur, in(source offset) , ...kind ဆိုင်ရာ }
  text   : { text, style:{font,size,fill,fill2,k,strokeOn,stroke,opacity,bold,italic,underline,align,fx[]}, anim:{in,out,loop,dur}, pos:{x%,y%,rot} }
  audio  : { mediaId, gain, fade:{in,out}, fx:{eq,comp,reverb,echo,duck}, loop }
  video  : { mediaId, fit:'cover|contain', speed, filters:{brightness,contrast,saturation,blur} }
  image  : (overlay) { mediaId, pos, scale, opacity }
```
- Clip အားလုံး split / trim / move / delete / ripple / snap ကို **တူညီစွာ** သုံး (`engine/timeline.js`)။
- Time က စက္ကန့် (float)၊ ပုံ/စာ နေရာက **% ဖြစ်လို့** aspect ratio ပြောင်းလည်း layout မပျက်။
- Undo/redo = project snapshot history (`engine/store.js`၊ ရှိပြီး)။ `edit(fn,{key})` နဲ့ slider/စာရိုက် တစ်ခါတည်း undo step။

### ၄.၄ Engine ပိုင်းတွေ
- **render.js**: `drawFrame(ctx,W,H,project,t)` — Preview နဲ့ Export တူတူသုံး၊ ကျပန်း (random) မသုံး (seeded)၊ font မဖွင့်ခင် မဆွဲ။
- **transport.js**: အခု frame timer၊ **Phase 3 မှာ audio clock ကို master** လုပ်မယ်။
- **audio.js**: `buildGraph(ctx, project)` တစ်ခုတည်းကို Preview (AudioContext) နဲ့ Export (OfflineAudioContext) နှစ်ခုလုံးသုံး (v1 မှာ အလုပ်ဖြစ်ခဲ့တဲ့ ပုံစံ)။
- **export.js**: frame တိုင်း `await` နဲ့ decode/render → Mediabunny `CanvasSource` + `AudioBufferSource`၊ progress/cancel၊ AAC မရရင် Opus။
- **media.js**: ဖိုင် import → Blob ကို IndexedDB ထဲ သိမ်း (reload လုပ်လည်း ပြန်ပေါ်)၊ decode cache၊ waveform peaks cache၊ video thumbnails။
- **myanmar.js**: syllable ခွဲ၊ Zawgyi→Unicode၊ `Intl.Segmenter('my')` word wrap၊ (grapheme ကို မသုံးရ — သရအမှတ်တွေ ပြတ်)။

---

## ၅။ အဆင့်များ (အသေးစိတ် + လက်ခံစစ်ဆေးချက်)

### အဆင့် ၀ — Shell ✅
နမူနာ layout၊ dark/light၊ ခလုတ်/tab တွေ အတု demo။ *(ပြီး)*

### အဆင့် ၁ — Engine core ⚙️ (ကုဒ်ပြီး၊ မတင်ရသေး)
**ပါတာ**: project model၊ store+undo/redo၊ autosave (IndexedDB)၊ My Projects menu (New/Open/Delete)၊ Canvas renderer (text clip)၊ transport (Play/Pause/seek)၊ Text tool (Add text၊ ကဗျာ paste → စာကြောင်းတစ်ကြောင်း clip တစ်ခု)၊ Inspector (font/style/color/stroke/size/opacity/position/rotate/timing)၊ canvas ပေါ်မှာ စာကို ဆွဲရွှေ့ + center snap၊ keyboard (Space/Del/Ctrl+Z/Y/D/←→)၊ R2 fonts အလိုအလျောက် တင်။
**စစ်ဆေးချက်**: ☐ Add text → clip ပေါ်၊ canvas မှာ စာမြင် ☐ Inspector ပြင် → canvas ချက်ချင်းပြောင်း ☐ Ctrl+Z/Y ☐ ကဗျာ paste → clip များ ☐ Play → time ပြေး ☐ Reload → ဗလာ၊ My Projects ကနေ ပြန်ဖွင့် → ပြန်ပေါ် ☐ မြန်မာစာ မှန် (သင့်ကွန်ပျူတာမှာ)။
**တိုးတက်ဖို့ ပြင်စရာ (Phase 1.5)**: Add text/lines က **အရင် clip နဲ့ မထပ်ရ** (လက်ရှိ playhead မှာ ထည့်လို့ ထပ်နေတာ တွေ့ပြီး) — အဆုံးကနေ ဆက်ထည့်၊ ထပ်ရင် lane အသစ်။

### အဆင့် ၂ — Timeline (CapCut လို clip အလုပ်)
- Clip **ဆွဲရွှေ့**၊ **အစွန်းဆွဲ trim**၊ **Split** (Ctrl+B/S playhead မှာ)၊ **Delete / Shift+Delete (ကွက်လပ်ပိတ်)**၊ **Delete left/right (Q/W)**၊ **Snap** (playhead/clip အစွန်း၊ Shift=ပိတ်)၊ **Multi-select** (Shift/Ctrl+click၊ box select)၊ **Duplicate**၊ Marker (M)။
- Track အတွင်း clip ထပ်တာကို ကာကွယ် (lane အလိုအလျောက် ထပ်ထည့် သို့ တွန်း)။ Track hide/lock/mute အလုပ်လုပ်။
- **Zoom** (Ctrl+wheel၊ slider၊ Fit)၊ ဘယ်ညာ scroll၊ playhead လိုက် scroll၊ Ruler scrub။
- Track အသစ်ထည့်/ဖျက်/နာမည်ပြောင်း။
**စစ်ဆေးချက်**: ☐ clip ဆွဲ/trim/split/delete တိုင်း Ctrl+Z နဲ့ ပြန်ရ ☐ မထပ် ☐ ၂၀၀ clip ရှိလည်း ချောမွေ့ ☐ Zoom ချဲ့/ချုံ့ ☐ ကီးဘုတ် shortcut များ။

### အဆင့် ၃ — Media + Audio (အသံ clock = master)
- **Local import** (ဖိုင်ရွေး/ဆွဲချ) → IndexedDB ထဲ Blob သိမ်း၊ **Library tab** = R2 (Music/BG/Logo/SE) tiles + preview။
- **Record tab** (microphone → ကဗျာဖတ်သံ clip)။
- Audio clip: waveform၊ gain၊ fade in/out၊ mute၊ loop (Music)။ Video/Photo clip: thumbnail strip၊ fit၊ speed။
- Preview audio = Web Audio (clip အကုန် schedule)၊ **audio clock က time ကို ထိန်း** (v1 နည်းအတိုင်း)၊ seek/scrub အဆင်ပြေ။
- Video ဖိုင်ကို ပင်မအဖြစ်သုံးရင် ပုံကို clip နဲ့အတူ ဖြတ်/ရွှေ့လို့ရ (v1 မှာ မရသေးတာ)။
**စစ်ဆေးချက်**: ☐ ဖတ်သံ import → Timeline မှာ waveform ☐ Reload → ဖိုင် ပြန်ရွေးစရာမလို ☐ Play → အသံ၊ playhead ကိုက် ☐ Record → clip ☐ R2 Music tile → ထည့်လို့ရ။

### အဆင့် ၄ — Text စနစ် ပြည့်စုံ + ကဗျာ workflow
- Style အားလုံး: **အရောင်နှစ်မျိုး (fill/fill2/k)**၊ stroke ပါ/မပါ၊ shadow/glow/gradient စသည့် **effect ၁၅ ခု**၊ animation **In / Out / Loop** (clip တစ်ခုချင်း)၊ per-clip font၊ canvas ပေါ်မှာ **ချဲ့/လှည့် handle**၊ double-click ပြင်။
- ကဗျာ workflow: paste → စာကြောင်းခွဲ → **Tap-sync** → **Auto-draft (VAD)** → confidence/Review/Lock → split/merge စာတန်း၊ SRT export၊ Zawgyi→Unicode၊ syllable အလိုက် Typewriter/Word reveal။
- Presets/Templates (Title card၊ Credits၊ ရှိပြီးသား 5 ခု)။
**စစ်ဆေးချက်**: ☐ အချိန်ကိုက် (ဖတ်သံနဲ့ စာတန်း ±၂၀၀ms အတွင်း) ☐ Preview ≈ Export (တူ) ☐ မြန်မာသရ/သတ် မှန် (effect ၁၅ ခု မှာပါ စမ်း)။

### အဆင့် ၅ — Audio Mixer + Visual effects
- Track တစ်ခုချင်း **EQ / Compressor / Reverb / Echo / Pan / Volume**၊ **Ducking** (ဖတ်သံပေါ်မှာ Music ချ)၊ SE clip (R2)၊ Limiter၊ Meter၊ Bypass compare — v1 `audio.js` ကို clip model အပေါ် ပြန်တည်ဆောက်။
- Video/Photo **Filters/Adjust** (brightness/contrast/saturation/blur)၊ Transitions အခြေခံ (fade/slide)၊ Overlay logo (corner credit)။

### အဆင့် ၆ — Export
- Mediabunny MP4 (H.264 + AAC)၊ progress/cancel၊ Resolution ရွေး (720p/1080p/9:16 …)၊ **Preview နဲ့ Export တူညီ**၊ အသံ offline render (ဖတ်သံ/Music/SE/ducking)။
- ရှည်တဲ့ export အတွက် File System Access API streaming (option)။
- **အဟောင်း (v1) project JSON → v3 ပြောင်းယူ** importer။
**စစ်ဆေးချက်**: ☐ ၁ မိနစ်၊ ၅ မိနစ် export ☐ VLC / ဖုန်း / YouTube တင်လို့ ☐ ffprobe နဲ့ A/V sync ≤ ၄၀ms ☐ ၉:၁၆ ☐ မြန်မာစာ မှန်။

### အဆင့် ၇ — Polish + v1 အစားထိုး
- Project manager (rename/duplicate/export-import JSON)၊ Shortcut စာရင်း (? panel)၊ Performance (≥30fps)၊ Memory (decode buffer ကို လိုအပ်မှ ထိန်း)၊ Error banner၊ Accessibility အခြေခံ။
- `/app` ကို `/v2` ကို ညွှန်ပြ၊ v1 ကို `public/legacy/` သို့ ရွှေ့၊ တည်ငြိမ်ပြီးမှ ဖျက်။

### အဆင့် ၈ — Auto caption (ASR) + လုံခြုံရေး
- **ဆုံးဖြတ်ချက်ဂိတ်**: (က) ကိုယ့်ကွန်ပျူတာမှာ မြန်မာ fine-tune Whisper (`local-asr/`)၊ (ခ) အခကြေးငွေပေး API၊ (ဂ) မလုပ်ဘဲ Tap-sync/Auto-draft နဲ့ပဲ။ ပိုကောင်းတဲ့ model ရှာ၊ တကယ်ကဗျာဖတ်သံနဲ့ တိုင်းတာပြီးမှ ရွေး။
- အလုပ်လုပ်ပုံ: pause နဲ့ chunk ဖြတ် → ASR → (A) စာသားထုတ်၊ (B) **ကိုယ့်စာသားကို syllable alignment နဲ့ ချိန်ကိုက်** (ကုဒ်က v1 `autocaption.js` မှာ ရှိပြီး — အဆင့် ၄ clip model အပေါ် ပြောင်းသုံး)။
- **Cloudflare Access ဖွင့်** + `ACCESS_AUD` ထည့် — `/api/*` ကာကွယ်။

---

## ၆။ v1 → v2 အင်္ဂါရပ် လွှဲပြောင်းမှု (မကျန်ရစ်အောင်)

| v1 | v2 မှာ ဘယ်အဆင့် |
|---|---|
| Tap-sync၊ Auto-draft (VAD)၊ Review/Lock | ၄ |
| စာ effect ၁၅ ခု၊ animation၊ preset | ၄ |
| အရောင်နှစ်မျိုး၊ stroke on/off၊ per-line style | ၄ |
| Zawgyi→Unicode၊ syllable ကိရိယာ | ၄ (`myanmar.js`) |
| Font (R2 `Fonts/`၊ ကိုယ်ပိုင်ဖိုင်) | ၁ ✅ (R2) / ၄ (ကိုယ်ပိုင်ဖိုင် ခလုတ်) |
| R2 Music/BG/Logo/SE tiles | ၃ |
| အသံသွင်း | ၃ |
| Audio Mixer (EQ/comp/reverb/echo/duck/SE/limiter) | ၅ |
| Credits/Title card၊ corner credit | ၄–၅ (template) |
| SRT export | ၄ |
| MP4 export (AAC→Opus fallback) | ၆ |
| Voice split/trim/ဖြတ်ထုတ်၊ undo | ၂ (clip အားလုံးအတွက်) |
| 9:16 safe-area guide | ၄ (overlay) |

---

## ၇။ စမ်းသပ်မှု ဗျူဟာ

- **Unit** (`tests/unit`, node): model/store (undo coalescing)၊ clip operations (split/trim/ripple/snap)၊ myanmar.js (syllable/Zawgyi)၊ alignment။
- **E2E** (`tests/e2e`, headless Chromium + local bundle): ခလုတ်နှိပ်/စာရိုက်/ဆွဲ/undo/reload/project ပြန်ဖွင့်/export တစ်ခုချင်းကို screenshot နဲ့ စစ်။
- **Golden frames**: render ထားတဲ့ frame တွေကို reference နဲ့ နှိုင်း (Preview = Export အတွက်)။
- **လက်ဖြင့် (သင်)**: အဆင့်တိုင်း checklist၊ Windows Chrome/Edge၊ မြန်မာ font ကိုယ်တိုင်ကြည့်။
- Headless sandbox မှာ မြန်မာ font မရှိလို့ စာပုံသဏ္ဍာန် မှန်/မမှန်ကို **သင့် browser မှာပဲ** စစ်နိုင်တယ်။

---

## ၈။ အန္တရာယ်များ + ကာကွယ်ရေး

| အန္တရာယ် | ကာကွယ်ပုံ |
|---|---|
| Browser အစစ်မှာ ကျိုးတာ ကျွန်တော် မမြင်ရ | Error banner (စာမျက်နှာပေါ်မှာ ပြ)၊ အဆင့်သေးသေး၊ screenshot ပို့ခိုင်း |
| မြန်မာစာ rendering (သရ/သတ်၊ font မရှိ) | Font အရင်ဖွင့်မှ ဆွဲ၊ grapheme မသုံး၊ `Intl.Segmenter`၊ effect တစ်ခုချင်း စမ်း |
| Preview နဲ့ Export မတူ | `drawFrame` တစ်ခုတည်း၊ ကျပန်းမသုံး၊ golden frame |
| A/V မကိုက် | audio clock master၊ encoder delay calibration၊ ffprobe စစ် |
| မှတ်ဉာဏ် (ဖတ်သံရှည် AudioBuffer) | လိုအပ်မှ decode၊ peaks cache၊ ဖုံးမထားတာ ပြန်ဖြန့်ချိ |
| Project ပျောက် | Autosave၊ JSON export/import၊ undo history |
| ဒေတာ/Font လိုင်စင် | Font ကို private R2 ထဲပဲ၊ public repo မထည့်ရ |
| `/api/*` public | အဆင့် ၈ မတိုင်ခင် **Access ဖွင့်** ဖို့ အကြံပြု |
| အကြီးကြီး ပြန်ရေးလို့ v1 အင်္ဂါရပ် ပျောက် | §၆ စာရင်းအတိုင်း၊ v1 ကို အဆင့် ၇ အထိ မဖျက် |

---

## ၉။ ဆုံးဖြတ်ချက် မှတ်တမ်း

- UI အသွင်အပြင် = VidPro နမူနာ၊ အလုပ်လုပ်ပုံ = CapCut။ ခလုတ်/tab စာလုံး **English**၊ ရှင်းလင်းချက်/tooltip **မြန်မာ** (`ui/strings.js` မှာ ပြောင်းလို့ရ)။
- Library = Preact + htm (CDN ပုံသေ version)၊ build tool မသုံး။
- Project data = Track → Clip (v3)၊ နေရာ % ၊ အချိန် စက္ကန့်။
- Local media ကို IndexedDB ထဲ Blob သိမ်း (v1 လို ပြန်ရွေးစရာ မလို)။
- Auto caption: Cloudflare Workers AI Whisper = **မြန်မာမှာ သုံးမရ** (စမ်းပြီး)။ Hugging Face Docker Space = အခု **အခကြေးငွေ (PRO) လို**။ ကျန်လမ်း = ကိုယ့်ကွန်ပျူတာ (`local-asr/`) ဒါမှမဟုတ် အခကြေးငွေ API → အဆင့် ၈ မှာ ဆုံးဖြတ်။
- Font (AJ Kunheing, Aka02) = လိုင်စင်မရှင်းလို့ **private R2 `Fonts/` ထဲပဲ**။
- Cloudflare Access = ပြီးမှ (AUD tag လို)။

### ဆုံးဖြတ်ရန် ကျန်သေး
- Stickers / Transitions tool တွေ လိုအပ်မလား (ကဗျာဗီဒီယိုအတွက်)။
- UI တစ်ခုလုံး မြန်မာလို ပြောင်းမလား (အခု English labels)။
- ASR လမ်းကြောင်း (အဆင့် ၈)။

---

## ၁၀။ နောက်ထပ် လုပ်ရမယ့်အရာ (ချက်ချင်း)

1. **Phase 1 ကို user Chrome မှာ စစ်** — Text tool → Add text/poem lines၊ Inspector ပြင်၊ canvas drag၊ Play/Pause/seek၊ Undo/Redo၊ project Save/Open/reload နှင့် မြန်မာစာ rendering။
2. **အဆင့် ၂ (Timeline) ကို user Chrome မှာ စစ်** — clip drag/trim/split/delete/ripple-delete/snap/multi-select/zoom နှင့် Ctrl+B, Delete, Shift+Delete shortcuts။
3. အဆင်ပြေရင် **အဆင့် ၃ (Media + Audio)** စ — local import, IndexedDB Blob, waveform, record, R2 library နှင့် audio clock ကို ဆက်တည်ဆောက်မယ်။
3. သင်ပြင်ဆင်ရန်: R2 `Fonts/` ထဲ font တင်၊ စမ်းသပ်ဖို့ ကဗျာဖတ်သံ audio ၁–၂ မိနစ် (ကိုယ့်ဖတ်သံ) ပြင်ထား၊ (လိုရင်) Cloudflare Access AUD tag။
