# ForNyein — တည်ဆောက်မှု အစီအစဉ် (Plan.md) · v3

ဒီဖိုင်ဟာ **တစ်ခုတည်းသော အစီအစဉ်** ဖြစ်ပါတယ်။ chat memory မရှိတဲ့အတွက် session အသစ်တိုင်း (လူ/AI မရွေး) **ဒီဖိုင်နဲ့ `docs/VERIFY.md` ကို အရင်ဖတ်ပြီးမှ** ဆက်လုပ်ပါ။
v3 ပြင်ဆင်ချက် (Nov 2026): စစ်ဆေးမှု (`docs/VERIFY.md`) ရလဒ်နဲ့ ကိုက်အောင် status ကို ပြင်၊ **Timeline System v2 spec** (§5) ကို ရှာဖွေလေ့လာမှုအပေါ် အခြေခံပြီး အသစ်ထည့်၊ လမ်းပြမြေပုံ (§6) ကို **Stabilization အရင်** ဖြစ်အောင် ပြန်စီ၊ အလုပ်လုပ်ပုံစည်းမျဉ်း (§3) ကို တင်းကျပ်။

---

## ၁။ ရည်ရွယ်ချက်

မြန်မာကဗျာ ဖတ်သံ/ဗီဒီယိုကို **CapCut လို အလုပ်လုပ်ပုံ** (Track → Clip၊ split/trim/ရွှေ့/ဖျက်/ကပ်၊ ညာဘက် Inspector) နဲ့ **ကိုယ်ပိုင် UI** (VidPro နမူနာအတိုင်း) ပါတဲ့ editor၊ Browser ထဲမှာပဲ MP4 ထုတ်ပေးနိုင်ရမယ်။

**"ပြီးပြီ" ဆိုတာ ဒီအချက်တွေ အားလုံး မှန်တာ (Release gate)**
1. ကဗျာတစ်ပုဒ် (ဖတ်သံ + စာသား) ကို ထည့်၊ စာတန်းချိန်ကိုက်၊ စာပုံစံ/animation ပြင်၊ Music/နောက်ခံ ထည့်ပြီး **အသံပါ MP4 ထုတ်လို့ရ** — အသံ/ပုံ ကိုက်ညီ၊ **မြန်မာစာ ဘယ်အဆင့်မှာမှ မပျက်**။
2. Reload လုပ်ရင် project + media မပျောက်။
3. ဖြတ်/ဖျက်/ရွှေ့/trim/undo တိုင်း မကျိုး၊ **Preview ကြားရ/မြင်ရတာ = Export ထွက်တာ**။
4. Chrome/Edge (desktop) မှာ တည်ငြိမ်၊ ၅ မိနစ်ကဗျာ project မှာ ချောမွေ့။
5. ကိုယ်ပိုင် font (R2 private) သုံးလို့ရ။

---

## ၂။ လက်ရှိအခြေအနေ (စစ်ဆေးမှု အခြေခံ — Nov 2026)

**Status စကားလုံး (အစဉ်အလာ ပြောင်း)**: 🟡 = ကုဒ်ရေးပြီး (မစစ်/တစ်စိတ်တစ်ပိုင်းစစ်) · 🟢 = **စစ်ပြီး** (ဘယ်သူ၊ ဘာနဲ့ စစ်ကြောင်း မှတ်) · 🔴 = အမှားတွေ့/ပိတ်ဆို့ · ⏸ = ရပ်ထား။ **အထောက်အထားမပါဘဲ 🟢/✅ မရေးရ။**

| အပိုင်း | အခြေအနေ | အထောက်အထား / မှတ်ချက် |
|---|---|---|
| v1 (`/app`) | ⏸ `/v2` သို့ redirect လုပ်ပြီး၊ ကုဒ်ကို `public/legacy/` မှာ သိမ်း | ဖျက်ခွင့် = Release gate ပြီးမှ |
| Shell (UI/theme) | 🟢 | user screenshot + sandbox screenshot (dark/light) |
| Engine core (store/undo/autosave/render/transport) | 🟢 | unit ၈ + e2e ၁၄ pass (VERIFY §1) |
| Timeline ops (move/trim/split/ripple/snap/multi-select/zoom) | 🔴 | action အဆင့် pass (text split+undo, ripple, lock, trim limit)၊ **B4** (audio in-point) နဲ့ **B7** (clip ထပ်လို့ရ) ကျ။ Mouse gesture မစစ်ရသေး |
| Media import + audio clip + waveform | 🟡 | import→tile→audio clip ပေါ်တာ pass။ **B5** (preview re-seek ~8/s) |
| Text tools + poem workflow | 🔴 | preset ခလုတ်၊ Auto-draft (±0.02 s)၊ SRT pass။ **B1: မှန်တဲ့ Unicode စာကို `normalizeMyanmar` က ဖျက်** |
| Audio mixer (EQ/comp/reverb/echo/duck) preview | 🟡 | UI ရှိ၊ အသံ နားနဲ့ မစစ်ရသေး |
| Visual (video/photo/filters/overlay logo/transitions) | 🟡 | မစစ်ရသေး |
| **Export (MP4/WebM)** | 🔴 | အသံမပါ MP4 pass (ffprobe H.264 1280×720 30fps 180f 6.0s)။ **အသံပါရင် မအောင် (B2)၊ WebM class နာမည်မှား (B3)၊ AAC→Opus fallback မရှိ (B8)၊ export အသံက EQ/reverb/echo/loop မသုံး (B6)** |
| Auto caption (Cloudflare Workers AI Whisper) | 🔴/⏸ | Workers AI Whisper က မြန်မာအသံကို တခြားစာလုံး (Georgian/Cyrillic) နဲ့ ပြန်ထုတ်ကြောင်း စမ်းပြီး (Nov 2026)။ ကုဒ်ရှိနေပေမဲ့ **မြန်မာအတွက် အသုံးမကျ** — §6 အဆင့် A ရဲ့ benchmark မှာ ပြန်စစ် |
| Cloudflare Access | ⏸ မဖွင့်ရသေး | `/api/*` public (origin စစ်ပဲ ရှိ) |
| `local-asr/` | ⏸ ပြင်ဆင်ထား၊ မစမ်းရ | |

**ဖြစ်ရပ်မှတ်**: repo ကို session နှစ်ခုက တစ်ပြိုင်နက် ရေးရင် ဖိုင်ထပ်ရေးခံရတာ ၂ ကြိမ်ကြုံ။ ပြီးခဲ့တဲ့ ✅ တွေကို VERIFY နဲ့ ပြန်တိုက်ပြီး အပေါ်ကလို ပြင်ထားတယ်။

---

## ၃။ အလုပ်လုပ်မယ့် နည်းလမ်း (တင်းကျပ်)

1. **Writer တစ်ယောက်ပဲ**: repo မှာ တစ်ချိန်တည်း ရေးသူ တစ်ဦးတည်း။ မရေးခင် `git pull`/နောက်ဆုံး main ကို ဖတ်၊ ဖိုင်ကို SHA နဲ့မှ update။ **Feature ကြီးတွေကို branch (`feat/...`) မှာ လုပ်ပြီး စစ်ပြီးမှ main သို့ merge** (PR)။
2. **စမ်းမှ တင်**: node syntax + unit + `known-bugs.mjs` + e2e (`public/v2/tests/`)။ **Export ပြောင်းရင် ffprobe နဲ့ အသံ/ပုံ ပါ/မပါ၊ duration စစ်** ဖို့ မဖြစ်မနေ။
3. **စစ်ပြီးသားဆိုတာ အထောက်အထားနဲ့**: Plan §2 ကို ပြင်တိုင်း "ဘာနဲ့ စစ်" ရေး (`tests/...`, screenshot, ffprobe output)။
4. **သင့် Chrome မှာ စစ်** (မြန်မာ font၊ အသံကြား၊ mouse gesture၊ အစစ် export) — sandbox မှာ မရတာတွေကို `docs/VERIFY.md` §3 ထဲ စာရင်းသွင်းထား။
5. **CI**: `.github/workflows/test.yml` မှာ unit + known-bugs ကို push တိုင်း run (ပျက်ရင် merge မလုပ်)။ (အဆင့် S မှာ ထည့်)
6. **ကုဒ်ပုံစံ**: ဖိုင် ~၃၀၀ လိုင်းအောက်၊ **လိုင်းတစ်ခု ~၁၆၀ လုံးအောက်** (အခု one-liner ရှည်တွေက review မလုပ်နိုင်လို့)။ Module တစ်ခုက တာဝန်တစ်ခု။
7. Binary ဖိုင် (font/ပုံ) ကို connector နဲ့ မတင်နိုင် — သင်ကိုယ်တိုင် R2 / GitHub web မှာ တင်။
8. **Definition of Done**: unit test + e2e (သို့ ffprobe) + လက်ဖြင့်စစ်စာရင်း ✓ + docs update။ တစ်ခုမပြည့်ရင် 🟡 ပဲ။

---

## ၄။ ဖွဲ့စည်းပုံ (Architecture)

### ၄.၁ Tech
- Build tool မရှိ (Workers static assets က `public/` ကို တိုက်ရိုက်ပေး)။ Native ES modules။ UI = **Preact + htm** (CDN ပုံသေ version)။
- Preview/Export = **Canvas 2D `drawFrame`** တစ်ခုတည်း၊ အသံ = **Web Audio** graph builder တစ်ခုတည်း (Preview + OfflineAudioContext)၊ MP4/WebM = **Mediabunny** (WebCodecs)။
- သိမ်း = **IndexedDB** (project JSON + media Blob + waveform/thumbnail cache)၊ Library = **R2 private**၊ Worker = `/api/library|asset|presets|transcribe`။
- `navigator.storage.persist()` ကို တောင်းပြီး browser က IndexedDB ကို မဖျက်အောင်။

### ၄.၂ Project model (JSON v3 → **v3.1: source range ထည့်**)
```
project = { version:3, id, name, size, fps:30, tracks:[track], markers:[{id,t,label}], media:{id:{name,kind,dur,src}} , links:{} }
track   = { id, kind:'text'|'video'|'overlay'|'audio', name, hidden, locked, muted, solo, height:'s|m|l', magnet?:bool, clips:[clip] }
clip    = { id, kind, start, dur,                       // timeline range (စက္ကန့်၊ frame ကို quantize)
            src?: { mediaId, in, out, speed:1 },        // SOURCE range (OTIO source_range လို) — media clip အားလုံးမှာ မဖြစ်မနေ
            link?: groupId, ...kind ဆိုင်ရာ }
  text  : { text, style:{...}, anim:{in,out,loop}, pos:{x%,y%,rot}, state:'draft|review|locked', conf }
  audio : { role:'voice|music|sfx', gain, fade:{in,out}, fx:{eq,comp,reverb,echo}, loop }
  video/image: { fit, filters:{...}, pos, scale, opacity }
```
- **dur = (src.out − src.in) / speed** (loop မဟုတ်ရင်)။ **Split** = နှစ်ပိုင်းစလုံး `src.in/out` ခွဲ၊ **trim-left** = `src.in += Δ`၊ **slip** = start/dur မပြောင်းဘဲ `src.in/out` ရွှေ့။ (B4 ကို အရင်းကပြင်။)
- **Time quantize**: edit တိုင်းမှာ `start/dur` ကို `round(t·fps)/fps` (`engine/time.js`)။ အကြောင်းရင်း: float drift၊ frame-accurate export၊ SRT။ (နောက်ပိုင်းမှာ integer frame / rational ပြောင်းဖို့ ချန်ထား။)
- **Schema migration**: `migrate(project)` (v1→v3→v3.1)၊ project ဖွင့်တိုင်း validate၊ မှားရင် ပြင်/တိုင်ကြား (ပျောက်မသွားစေ)။
- Undo = snapshot history (အခုအတိုင်း၊ ≤ ၅၀၀၀ clip အထိ ပြဿနာမရှိ)၊ **drag တစ်ခုလုံး = undo ၁ ဆင့်**၊ undo label (e.g. "Split clip") ကို tooltip မှာ ပြ။

### ၄.၃ Engine ပိုင်းများ
`model.js` `store.js` `storage.js` `transport.js` `render.js` `fonts.js` `actions.js` (ရှိပြီး) · **အသစ်/ပြင်**: `time.js` (quantize)၊ `timeline.js` (clip ops တစ်နေရာထဲ)၊ `audio-graph.js` (Preview/Export မျှဝေ)၊ `peaks.js` (waveform LOD)၊ `myanmar.js` (syllable/Zawgyi)၊ `migrate.js`။

---

## ၅။ Timeline System v2 — ရှာဖွေလေ့လာမှုအပေါ် အခြေခံ spec

လေ့လာမှု: DaVinci Resolve / Final Cut / Nuke-Hiero ရဲ့ edit mode များ၊ OpenTimelineIO (source range + rational time)၊ CapCut desktop (magnetic main track, snapping, split/delete-left/right)၊ web editor များ (OpenCut, OpenReel, Kapwing, Editframe) ရဲ့ performance ဗျူဟာ။

### ၅.၁ အချိန်နဲ့ Clip model (အခြေခံ — T1)
- §၄.၂ ရဲ့ `src {in,out}` + frame-quantized time။ **Audio/video clip ကို split/trim လုပ်ရင် အသံ/ပုံ မရွေ့၊ မပြန်စ။**
- Clip မှာ တူညီသော ပြင်ဆင်မှု API (`timeline.js`): `move / trim(side) / split / slip / slide / roll / ripple* / delete(ripple?) / duplicate / insert / overwrite`။ UI၊ keyboard၊ test အားလုံး ဒီ API ကိုပဲ ခေါ်။

### ၅.၂ Track နဲ့ lane စည်းမျဉ်း (B7 ကိုဖြေ — T1)
- **တစ်ခု lane မှာ clip မထပ်ရ။** ထပ်မယ့် drop/move ဆိုရင် (က) text/overlay = **lane အသစ် အလိုအလျောက်ဖွဲ့** (CapCut လို track အသစ်)၊ (ခ) main track = နောက်ကို တွန်း (insert) သို့ ပယ်။
- **Main track (Video) magnetic** ဖွင့်/ပိတ် (CapCut `P`): ဖွင့်ရင် ဖျက်တာ၊ trim တာ ကွက်လပ်မကျန်အောင် ကပ်လာ။
- Track control: hide / lock / **mute / solo** / ပြန်စီ (drag) / height S-M-L / collapse / နာမည်ပြောင်း / ဖျက်။ Lock = ဘယ်လုပ်ဆောင်ချက်မှ မထိ (အခု ပြီး)။
- **Link group** (`clip.link`): ဖတ်သံ clip + ၎င်းကနေ ထုတ်ထားတဲ့ စာတန်းတွေကို ချိတ် — ဖတ်သံကို ရွှေ့/ဖြတ်ရင် စာတန်းပါ လိုက် (v1 "စာတန်းပါလိုက်")၊ link ဖြုတ်လို့ရ။

### ၅.၃ Edit tools (CapCut + DaVinci "smart trim" — T2)
| လုပ်ဆောင်ချက် | အပြုအမူ |
|---|---|
| Select/Move | clip အလယ်ကို ဆွဲ၊ **Shift = snap ပိတ်၊ Alt = copy** |
| Trim | အစွန်း ၉ px ဆွဲ၊ **modifier မပါ = normal၊ Shift = ripple trim (နောက်က ကပ်ရွှေ့)၊ Ctrl/Cmd = roll (ကပ်နေတဲ့ clip နှစ်ခုကြားနယ်ကို ရွှေ့)** |
| Slip / Slide | media clip အလယ်ကို **Alt+ဆွဲ = slip** (အကြောင်းအရာရွှေ့)၊ **Ctrl+Alt = slide** |
| Razor / Split | `B` tool၊ `Ctrl+B`/`S` playhead မှာ ရွေးထားတာ (မရွေးရင် under-playhead အားလုံး)၊ `Ctrl+Shift+B` = track အားလုံး |
| Delete | `Del` = ကွက်လပ်ချန်၊ `Shift+Del` = ripple၊ `Q`/`W` = playhead ရဲ့ ဘယ်/ညာ ဖျက် |
| In/Out range | `I`/`O` မှတ် → **Lift (ကွက်လပ်ချန်) / Extract (ripple) ဖြတ်ထုတ်** (`X`/`Shift+X`)၊ ဖတ်သံထဲက မလိုတဲ့အပိုင်းဖြတ်ရန် v1 အလုပ် |
| Drop media | Timeline ပေါ် drop = **Overwrite** (ပုံမှန်)၊ `Ctrl` = **Insert** (ripple) |
| Multi-select | Shift/Ctrl+click၊ **box select**၊ select-all-right (`Alt+→`)၊ ရွေးထားတာအားလုံး တူညီစွာ ရွှေ့/ဖျက်/trim |
| Nudge | ရွေးထားတာကို `←/→` = ၁ frame၊ `Shift+←/→` = ၁ s |
| Marker | `M` (playhead)၊ marker ကို snap point အဖြစ်သုံး၊ ruler မှာ ပြ |

### ၅.၄ Snapping
- Snap points: playhead၊ clip အစ/အဆုံး (track အားလုံး)၊ marker၊ In/Out၊ **ဖတ်သံ VAD phrase boundary** (စာတန်းကို ဖတ်သံနဲ့ ကပ်ဖို့)၊ ruler grid။
- Threshold **၈ px** (zoom မှ မူတည်)၊ ဖြူမျဉ်း guide၊ **Shift = ပိတ်**၊ toolbar ရဲ့ Snap toggle (`N`)။ Snap ရလဒ်ကို frame ကို quantize။

### ၅.၅ Playhead / Scrub / Playback
- **အသံ = Web Audio schedule** (`AudioBufferSourceNode.start(when, offset=src.in+..., dur)`)၊ **`<audio>.currentTime` ကို play နေစဉ် ထပ်ထပ်မပြင်** (B5)။ Play/seek/edit-during-play မှာပဲ reschedule။ AudioContext clock = master။
- **Audio scrubbing** (ruler ဆွဲတဲ့အခါ ၈၀–၁၅၀ ms အသံတိုထွက်) — ဖတ်သံအစရှာဖို့ အရေးကြီး။
- Shortcut: `Space` play/pause၊ `J/K/L` shuttle (နောက်/ရပ်/ရှေ့၊ ထပ်နှိပ် = မြန်)၊ `←/→` frame၊ `↑/↓` ရှေ့/နောက် edit point၊ `Home/End`၊ `\` loop selection၊ "play around cursor"။
- Follow-playhead: Auto (ညာစွန်းရောက်မှ) / Smooth / Off။

### ၅.၆ Zoom / Scroll / Layout
- Zoom: Ctrl+wheel (cursor ဗဟို)၊ `+/-`၊ **Fit (`Shift+Z`)၊ Zoom to selection**၊ slider။ **ပုံမှန် pps = ၆၀** (အခု ၁၀ — clip ကျဉ်းလွန်း)၊ ကဗျာ project ဖွင့်ချိန် Fit မဟုတ်ဘဲ ရွေးထားတဲ့အပိုင်းကို ပြ။
- Minimap/overview bar (ကဗျာရှည်ရင် လွယ်)၊ ဒေါင်လိုက် scroll (track များရင်)၊ sticky track header။

### ၅.၇ Performance (ရှာဖွေတွေ့ချက် — T5)
- **Virtualize**: မျက်နှာပြင်ပေါ်က clip ကိုပဲ render (windowing)၊ clip ≥ ၃၀၀ ဆိုရင် **canvas timeline** သို့ ပြောင်းသုံးဖို့ ပြင်ဆင်။ Playhead ကို သီးသန့် component (ရှိပြီး) — transport tick တိုင်း အားလုံး re-render မလုပ်။
- **Waveform LOD pyramid**: peaks ကို ၁×/၄×/၁၆×/၆၄× ဖြင့် တစ်ခါတည်းတွက် (Worker)၊ IndexedDB မှာ cache၊ zoom အလိုက် level ရွေး။
- **Video thumbnails**: WebCodecs/`<video>` နဲ့ Worker ထဲ၊ viewport အတွက်ပဲ၊ LRU + IndexedDB cache။ **Frame ghosting** (scrub ချိန် မဲမဲ frame မပေါ်) ။
- Preview: **adaptive resolution** (frame-budget ကျော်ရင် canvas scale လျော့)၊ Perf HUD (fps, render ms) ကို dev toggle။
- **Budget**: clip ၁၀၀၀ မှာ pan/zoom ≥ ၆၀ fps၊ ကဗျာ ၅ မိနစ် (စာတန်း ~၆၀ + ဖတ်သံ + music) preview ≥ ၃၀ fps၊ project ဖွင့် ≤ ၃ s။

### ၅.၈ ကဗျာအတွက် သီးသန့် Caption lane tools (T6)
- **စာတန်းကို timeline ထဲမှာပဲ ပြင်** (double-click inline)၊ စာရင်းနဲ့ timeline နှစ်ဘက်ပြောင်း sync။
- Bulk: **ရွေးထားတာကို ±frame/၁ s ရွှေ့**၊ "ဒီနေရာကနောက် အားလုံးရွှေ့ (ripple captions)"၊ **ဖတ်သံ phrase boundary သို့ ကပ် (snap-to-voice)**။
- **Confidence အရောင်** (အနီ/ဝါ/စိမ်း)၊ Review next (`R`)၊ Lock (`L`)၊ Tap-sync (အရင် v1 အတိုင်း — live)၊ Auto-draft (ရှိပြီး)။
- **Word/syllable အဆင့် timing** (Karaoke) ကို clip အတွင်း keyframe အဖြစ် (နောက်ပိုင်း)။
- မြန်မာစာ မပျက်ရေး: caption ပြုပြင်ရေး tool တွေက **စာသားကို မပြောင်း** (B1 ပြင်ပြီးမှ)။

### ၅.၉ Accessibility + Discoverability
- Clip ကို keyboard focus (Tab)၊ nudge/trim/delete keyboard နဲ့၊ `aria-label` (track, clip, time)၊ `?` = shortcut စာရင်း (ရှိပြီး)၊ Tooltip မှာ shortcut ပါ။

---

## ၆။ လမ်းပြမြေပုံ (ပြန်စီ — Stabilization အရင်)

### Phase S — Stabilization (ယခု၊ **feature အသစ် မထည့်ခင်**)
| # | လုပ်ရန် | ပိတ်ကွင်း (done when) |
|---|---|---|
| S1 | **B1** `normalizeMyanmar` ဖယ် (စာမပြောင်း)၊ Zawgyi→Unicode = `rabbit-node` ကို ခလုတ်/ခန့်မှန်းပြီး confirm | `known-bugs.mjs` B1 PASS၊ UI မှာ Unicode ကဗျာ paste ပြီး စာမပြောင်း |
| S2 | **B2+B3+B8** Export: audio render → track နှစ်ခုလုံးထည့် → `start()`၊ `WebMOutputFormat`၊ AAC မရရင် Opus | **ffprobe: video + audio stream နှစ်ခုပါ**၊ duration ±၀.၁ s၊ MP4 + WebM နှစ်မျိုး (`scripts/validate-export.mjs` ကို ဖတ်သံပါ project နဲ့) |
| S3 | **B4** clip `src{in,out}` မော်ဒယ် + migration၊ split/trim ကို ပြင်၊ preview/export offset | known-bugs B4 PASS၊ split ပြီး Play → ညာတစ်ဝက် အဆက်ပြတ်မရှိ (ဖတ်သံ ၂ ပိုင်းခွဲ → ပေါင်းနားထောင်ရင် မူရင်းနဲ့ တူ) |
| S4 | **B5** audio scheduling ကို `AudioBufferSourceNode` (သို့ seek-on-demand) | play ၂ s အတွင်း `currentTime` ပြင်ကြိမ် ≤ ၃၊ သင့်နားနဲ့ stutter မရှိ |
| S5 | **B7** lane စည်းမျဉ်း (no overlap၊ auto lane) | known-bugs B7 PASS |
| S6 | **B6** Preview/Export အသံ graph ကို `audio-graph.js` တစ်ခုတည်း | EQ/reverb ဖွင့်ထား project ကို export → preview နဲ့ spectrum ကွာခြားမှု ≤ ၃ dB (offline test) |
| S7 | CI (`.github/workflows/test.yml`)၊ ကုဒ်ပုံစံ (လိုင်းအရှည်)၊ SRT BOM | CI စိမ်း |
| S8 | **သင့် Chrome မှာ regression စစ်** (VERIFY §3 စာရင်း) | စာရင်းအားလုံး ✓ |

> Phase S မပြီးမချင်း 🟢 မထည့်၊ အသစ်ထည့်တဲ့ feature မရှိ။

### Phase T — Timeline v2 (§၅)
T1 အချိန်/clip model + lane (S3/S5 နဲ့ ပေါင်း) → T2 edit tools (razor/ripple/roll/slip/range/magnetic) → T3 selection + link group + marker → T4 playhead/scrub/J-K-L + audio scrub → T5 performance (virtualize, waveform LOD, thumbnails) → T6 caption lane tools။
**စစ်ဆေးချက်**: ☐ ကိရိယာတိုင်း Ctrl+Z ပြန်ရ ☐ clip မထပ် ☐ ၁၀၀၀ clip ≥ ၆၀ fps ☐ audio scrub ☐ ဖတ်သံ split/ripple/slip လုပ်ပြီး export → အသံ/စာတန်း ကိုက် ☐ keyboard-only နဲ့ editing ဖြစ်။

### Phase E — Export hardening
Preview=Export parity (golden frames + audio graph test)၊ ၁/၅/၁၀ မိနစ် export (ffprobe A/V drift ≤ ၄၀ ms)၊ VLC/ဖုန်း/YouTube၊ ရှည်တဲ့ export အတွက် File System Access streaming + memory ကန့်သတ်၊ VP9/WebM fallback၊ cancel/resume၊ 9:16/1:1/4:5။

### Phase M — Myanmar quality
Font matrix (R2 fonts အားလုံး × effect ၁၅ ခု × မြန်မာ သရ/သတ်/ပေါင်းစပ်)၊ wrap (`Intl.Segmenter`) စမ်း၊ syllable-aware Typewriter/Word reveal၊ Zawgyi ထောက်လှမ်း + ပြောင်း၊ ကိုယ်ပိုင် font ဖိုင်ခလုတ်၊ 9:16 safe-area guide။ **ဒီအဆင့်ကို user Chrome မှာပဲ စစ်ရ။**

### Phase A — Auto caption (ဆုံးဖြတ်ချက်ဂိတ် — benchmark အရင်)
1. **Benchmark protocol**: user ရဲ့ တကယ်ကဗျာဖတ်သံ ၁၀ ခု (၃၀–၉၀ s) + မှန်တဲ့စာသားနဲ့ **CER** တိုင်း။ ယှဉ်: (က) Workers AI Whisper (ပြီးပြီ — ညံ့)၊ (ခ) မြန်မာ fine-tune Whisper (`local-asr/`)၊ (ဂ) အခကြေးငွေ API (ဥပမာ ElevenLabs Scribe/Google)။
2. **လက်ခံမယ့်စံ**: alignment mode (ကိုယ့်စာသားကို အချိန်ရှာ) အတွက် CER ≤ ၃၀% ၊ စာသားထုတ် mode အတွက် CER ≤ ၂၀% — မရရင် **VAD + Tap-sync (ရှိပြီး)** ကိုပဲ အဓိကထား။
3. ရလဒ်တိုင်းကို confidence နဲ့ `draft|review` ပြ၊ **အသံကို ပို့တာ privacy သတိပေး**။

### Phase R — Release
Cloudflare Access ဖွင့် + `ACCESS_AUD`၊ CSP header (`script-src 'self' cdn.jsdelivr.net`)၊ accessibility audit၊ `/v2` → ပင်မလိပ်စာ၊ **Release gate (§၁) အားလုံး ✓ မှ `public/legacy/` ဖျက်**။

---

## ၇။ v1 → v2 အင်္ဂါရပ် လွှဲပြောင်းမှု (အခြေအနေ)

| v1 | v2 အခြေအနေ |
|---|---|
| Tap-sync၊ Auto-draft (VAD)၊ Review/Lock | 🟡 (Auto-draft 🟢) |
| စာ effect ၁၅ ခု၊ animation၊ preset၊ အရောင်နှစ်မျိုး၊ stroke | 🟡 (မြန်မာ rendering — Phase M) |
| Zawgyi→Unicode | 🔴 B1 |
| Font (R2 `Fonts/`၊ ကိုယ်ပိုင်ဖိုင်) | 🟡 |
| R2 Music/BG/Logo/SE tiles၊ အသံသွင်း | 🟡 မစစ်ရ |
| Audio Mixer + Ducking | 🟡 preview / 🔴 export parity (B6) |
| Credits/Title card၊ SRT | 🟢 SRT / 🟡 Title |
| MP4 export | 🔴 B2 |
| ဖတ်သံ split/trim/ဖြတ်ထုတ်/undo | 🔴 B4 → T2 |
| 9:16 safe-area guide | ⏸ Phase M |

---

## ၈။ စမ်းသပ်မှု ဗျူဟာ

- **Unit** (`public/v2/tests/unit`): model/store/timeline ops (property-style: ကျပန်း ops ၁၀၀၀ ကြိမ်လုပ်ပြီး invariant — clip မထပ်၊ dur ≥ min၊ `src` range မကျော်၊ undo ပြန်လည်ကိုက်)၊ time quantize၊ myanmar.js (Unicode မပြောင်း)၊ alignment။
- **Known-bugs** (`tests/verify/known-bugs.mjs`): ပြင်ပြီးသား bug တိုင်းအတွက် စစ်ချက် ထပ်ထည့် (regression)။
- **E2E** (`tests/e2e`, headless Chromium + local bundle): UI flow၊ **import audio → split → export → ffprobe** အပါအဝင်။
- **Export validation**: `scripts/validate-export.mjs` ကို **အသံပါ project** နဲ့ပါ run၊ A/V drift၊ stream count၊ duration။
- **Golden**: frame (စာပါတဲ့ canvas) hash နှိုင်း၊ audio render spectrum နှိုင်း (preview vs export)။
- **လက်ဖြင့် (သင့် Chrome)**: VERIFY §3 စာရင်း၊ မြန်မာ font၊ အသံကြား၊ mouse gesture။

---

## ၉။ အန္တရာယ်များ + ကာကွယ်ရေး

| အန္တရာယ် | ကာကွယ်ပုံ |
|---|---|
| "✅ ပြီး" လို့ ပြောပြီး အမှန်တကယ် မစစ်ထားတာ | §၂ status စကားလုံး၊ အထောက်အထားမပါရင် 🟡၊ VERIFY ကို တိုက်ဆိုင်စစ် |
| Writer နှစ်ယောက် ပြိုင်ရေးလို့ ဖိုင်ထပ်ရေးခံရ | §၃(1) writer တစ်ယောက်၊ branch၊ SHA update |
| မြန်မာစာ ပျက် (normalizer၊ font၊ shaping) | စာသားကို မပြောင်းတဲ့ policy၊ unit test (Unicode မပြောင်း)၊ Phase M |
| Export ကို sandbox မှာပဲ စစ်ပြီး အစစ်မှာ ကွာ | ffprobe + သင့်စက် VLC/ဖုန်း၊ AAC/Opus fallback၊ H.264 မရတဲ့စက်အတွက် VP9 |
| Preview ≠ Export | graph/renderer တစ်ခုတည်း၊ golden test |
| Timeline မှာ clip များလာရင် နှေး | virtualize၊ LOD peaks၊ thumbnail worker/cache၊ budget |
| Project ပျောက် / schema ပြောင်းလို့ ဖွင့်မရ | `migrate()`၊ autosave၊ JSON export/import၊ `storage.persist()` |
| ကုဒ် ဖတ်မရအောင် one-liner ရှည် | ကုဒ်ပုံစံ စည်းမျဉ်း + CI |
| `/api/*` public၊ ASR မှာ အသံပို့ | Access ဖွင့် (Phase R)၊ origin စစ်၊ privacy သတိပေး |
| Font လိုင်စင် | Private R2 `Fonts/` ပဲ |

---

## ၁၀။ ဆုံးဖြတ်ချက် မှတ်တမ်း

- UI အသွင်အပြင် = VidPro နမူနာ၊ အလုပ်လုပ်ပုံ = CapCut။ Label **English**၊ tooltip **မြန်မာ** (`ui/strings.js`)။
- Preact + htm (CDN ပုံသေ)၊ build tool မသုံး။ Project = Track → Clip၊ **v3.1 မှာ `src{in,out}` + frame-quantized time** (Nov 2026 ထည့်)။
- Local media = IndexedDB Blob။ Font (AJ Kunheing, Aka02) = **private R2 ပဲ**။
- **Auto caption**: Workers AI Whisper = မြန်မာအတွက် **မအောင်** (စမ်းပြီး)၊ HF Docker Space = PRO လို၊ ကျန်လမ်း = `local-asr/` / အခကြေးငွေ API → **Phase A benchmark မှာ ဆုံးဖြတ်**။
- Cloudflare Access = Phase R မှာ။
- **Phase S ကို feature အသစ်မတိုင်ခင် ပြီးရမယ် (Nov 2026 ဆုံးဖြတ်)**။

### ဆုံးဖြတ်ရန် ကျန်သေး
- Stickers / Transitions (ကဗျာဗီဒီယိုမှာ လိုမလား)။ UI အားလုံး မြန်မာလို ပြောင်းမလား။
- Main-track magnet ကို မူလ ON ထားမလား (CapCut လို) သို့ OFF။
- Frame ကို integer သိမ်း (v4) သို့ စက္ကန့် float + quantize ပဲ (လက်ရှိ)။

---

## ၁၁။ နောက်ထပ် လုပ်ရမယ့်အရာ (ချက်ချင်း)

1. **Phase S (S1→S8)** ကို ပြီးအောင် — အစဉ်: S1, S2 (အလုပ်ရဖို့ အရေးကြီးဆုံး) → S3 → S4 → S5 → S6 → S7 → S8။
2. S ပြီးမှ **T1→T6**။ ကိရိယာတစ်ခုချင်း branch → စစ် → merge။
3. သင်ပြင်ဆင်ရန်: ကိုယ့်ကဗျာဖတ်သံ audio ၁–၂ မိနစ် (စမ်းဖို့)၊ ASR benchmark အတွက် ၁၀ ခု + မှန်တဲ့စာသား၊ R2 `Fonts/` ထဲ font၊ Cloudflare Access AUD tag၊ VERIFY §3 ရဲ့ သင့် Chrome စစ်စာရင်း။
