# Plan — Layer 3: M1 (Core NLE) လုပ်ငန်းခွဲ — Phase S + Timeline v2 + Export core

L1 (`Plan.md`) နဲ့ L2a/L2 ကို အခြေခံပြီး **M1 ကို ပြီးအောင် ဘာကို၊ ဘာအစဉ်နဲ့၊ ဘယ်လို တိုင်းတာပြီး** လုပ်မလဲ ဆိုတာ ရေးထားတာ။ ကုဒ်မပါ — **module/API စာချုပ် (contract)၊ အဆင့်၊ စစ်ဆေးချက်၊ အရွယ်၊ မူတည်ချက်၊ rollback** ပဲ။ ဘယ်သူ (ကျွန်တော်/တခြား session/လူ) လုပ်လုပ် ဒီအတိုင်း လိုက်လို့ရအောင်။

**အရွယ်အစား**: S ≤ ၂ နာရီ · M ≤ ၁ ရက် · L ≤ ၃ ရက် (အာရုံစိုက်လုပ်ချိန်၊ စစ်ချိန်ပါ)။ **Test ID** (`TC-…`) ကို L4 မှာ စုစည်းမယ်။

---

## ၀။ M1 ရဲ့ ထွက်ပေါက်စံ (Exit criteria — အားလုံး ✓ မှ M1 ပြီး)

| # | စံ | တိုင်းနည်း | တာဝန်ရှင် |
|---|---|---|---|
| X1 | `known-bugs.mjs` + unit + e2e အားလုံး PASS၊ CI စိမ်း | CI | ကျွန်တော် |
| X2 | **အသံပါ MP4 + WebM** export (ဖတ်သံ+Music+စာတန်း) — ffprobe: video+audio stream၊ duration ±၀.၁ s၊ A/V drift ≤ ၄၀ ms | `scripts/validate-export.mjs` + သင့်စက် VLC/ဖုန်း | နှစ်ဦး |
| X3 | မြန်မာ Unicode corpus ၁၀၀% မပျက် (paste→save→load→export→SRT) | corpus test | ကျွန်တော် |
| X4 | Audio clip split/trim/ရွှေ့ ပြီး play/export → အသံ အဆက်မပြတ်၊ မပြန်စ | node + လက်ဖြင့်နားထောင် | နှစ်ဦး |
| X5 | Timeline ကိရိယာအားလုံး (§၅) Ctrl+Z ပြန်ရ၊ clip မထပ်၊ locked မထိ | property test + e2e | ကျွန်တော် |
| X6 | ၅ မိနစ်ကဗျာ project (စာတန်း ~၆၀ + ဖတ်သံ + Music) preview ≥ ၃၀ fps၊ ၁၀၀၀ clip pan/zoom ≥ ၆၀ fps | Perf HUD | နှစ်ဦး |
| X7 | **သင့် Chrome မှာ regression စာရင်း** (VERIFY §3 + S8) အားလုံး ✓ | သင် | သင် |

---

## ၁။ အလုပ်အစုများ (Work Packages) နဲ့ မူတည်ချက်

```
S1 မြန်မာစာမပျက် ─┐
S2 Export အသံပါ ──┼─► E1 Export parity ─► X2
S3 src{in,out}+v4 ─┬─► S4 Audio playback ─► S6 Audio graph parity ─► E1
                   ├─► S5 Lane rules ─┐
                   └─► T1 Clip API ───┴─► T2 Edit tools ─► T3 Selection/link/marker ─► T4 Scrub/transport ─► T5 Perf ─► T6 Caption lane
S7 CI/lint ─ (အစောဆုံး၊ အားလုံးကို ကာကွယ်)
S8 User regression ─ (M1 နောက်ဆုံး)
```
**အကြံပြုအစဉ်**: **S7 (CI) → S1 → S2 → S3 → S4 → S5 → S6 → T1…T6 → E1 → S8**။ (S1/S2 က အသုံးဝင်မှုအတွက် အရေးအကြီးဆုံး၊ S7 ကို အရင်လုပ်မှ နောက်ပြင်ဆင်မှုတွေ မပြန်ပျက်)။
**Critical path**: S3 → S4 → S6 → E1။

---

## ၂။ Phase S — Stabilization

### S7 — CI + ကုဒ်ပုံစံ (လုပ်ဦးစီး) · **S** · မူတည်: မရှိ
**ရည်ရွယ်**: ပြီးသား/ပြင်ပြီးသား မပျက်ပြန်အောင် ကာကွယ်။
- `.github/workflows/test.yml`: push/PR တိုင်း `node public/v2/tests/unit/*.mjs` + `node public/v2/tests/verify/known-bugs.mjs`။ (known-bugs က ပြင်ပြီးမချင်း မအောင်ရင် CI ပျက်မယ် → ပထမ **"expected-fail" စာရင်း** (B1…B8) နဲ့ run၊ ပြင်လိုက်တိုင်း စာရင်းက ဖယ်။)
- `scripts/lint-lines.mjs`: ဖိုင်တစ်ခု ≤ ၃၀၀ လိုင်း၊ လိုင်း ≤ ၁၆၀ လုံး။ **ရှိပြီးသားဖိုင်တွေက allowlist** (ကျိုးနေတာကို နောက်ပိုင်းပြန်ရေးရင် ဖယ်)၊ **ဖိုင်အသစ်/ပြင်ထားတာကို fail**။
- SRT: UTF-8 BOM ထည့်။ Timeline default pps ၆၀။ "Local media မရှိ" empty-state CSS။
- `docs/shortcuts.md` ကို အစပြု။
**စစ်ဆေးချက်**: CI စိမ်း၊ PR တစ်ခု ကျိုးအောင် တမင်လုပ်ကြည့် → CI နီ။ **Rollback**: workflow ဖိုင်ဖျက်။

### S1 — မြန်မာစာ မပျက်ရေး (B1) · **M** · မူတည်: မရှိ
**အမှား**: `normalizeMyanmar` က မှန်တဲ့ Unicode ကို ဖျက် (ရေကို→ရကေို)။ `addLines/addTimedLines/Normalize` က အမြဲခေါ်။
**ဒီဇိုင်း**
- `engine/myanmar.js` (အသစ်): `isZawgyi(text) → { likely, score, reasons }`၊ `zg2uni(text)` (lazy load)၊ `splitSyllables(text)`၊ `NEVER_MUTATE` မူ။ Heuristic ရင်းမြစ်: Unicode မှာ `ေ` က ဗျည်း/ပေါင်းအမှတ်နောက်မှ လာ၊ **စကားလုံးအစ/space/ပုဒ်ဖြတ်နောက်မှာ `ေ` လာရင် Zawgyi အချက်ပြ**၊ U+1060–U+1097 ကို သုံးရင် Zawgyi (Unicode မြန်မာမှာ မသုံး) ။
- Zawgyi→Unicode **converter ကို v1 ကလို `rabbit-node` (MIT)** ကို **repo ထဲ vendor** (`public/v2/vendor/rabbit.min.js`၊ CDN မမှီခို၊ offline ရ)။ Converter ကို ကိုယ်တိုင်မရေး (အမှားများ)။
- UX: paste လုပ်တဲ့အခါ `isZawgyi` ကို စစ်၊ **အလိုအလျောက်မပြောင်း** — banner "Zawgyi ဖြစ်နိုင်ပါတယ် [Unicode ပြောင်း] [မပြောင်း]"၊ Text panel မှာ ခလုတ် "Zawgyi → Unicode" (ရှိပြီး) ကိုသာ ပြောင်းစေ၊ ပြောင်းထားရင် **undo ရ**။
- `normalizeMyanmar` ကို **ဖျက်** (ခေါ်သူအားလုံးကိုဖယ်)။
**အဆင့်**: (၁) ခေါ်သူစာရင်း grep၊ (၂) ဖယ်၊ (၃) myanmar.js + vendor၊ (၄) UI banner၊ (၅) corpus test။
**စစ်ဆေးချက်**: `TC-TXT-01` corpus (L2 §၆) 100% `unchanged` through addLines/addTimedLines/split/merge/SRT/save-load/export-SRT · `TC-TXT-02` Zawgyi ၁၀ ကြောင်း→မျှော်မှန်း · `TC-TXT-03` banner ပေါ်၊ မပြောင်းပါဘူး ရွေးရင် စာမပြောင်း · `TC-TXT-04` repo ထဲ `normalizeMyanmar` ရှာမတွေ့ (static) · e2e ကဗျာ paste။
**အန္တရာယ်**: Zawgyi heuristic မှား (false positive) → မပြောင်းဘဲ confirm သာ၊ ထို့ကြောင့် စာမပျက်။ **Rollback**: ခလုတ်ကိုပိတ်။

### S2 — Export အသံပါ (B2, B3, B8) · **M** · မူတည်: မရှိ
**အမှား**: `output.start()` ကို audio track မထည့်ခင်၊ `WebmOutputFormat` မှား၊ AAC fallback မရှိ။
**ဒီဇိုင်း — Export pipeline အဆင့် (မပြောင်းရ)**
1. **Preflight**: capability probe (`VideoEncoder/AudioEncoder.isConfigSupported`: H.264, VP9, AAC, Opus) + project validate + ခန့်မှန်းအရွယ်/memory သတိပေး။
2. **Plan codec**: ရွေးချယ်မှု: MP4 = H.264+AAC (အကောင်းဆုံးသက်ဆိုင်)၊ AAC မရ → **WebM (VP9+Opus)** ကို အကြံပေး (သို့ MP4+Opus ကို format ကပံ့ပိုးမှသာ — runtime ကစစ်)၊ UI မှာ "ဘာကြောင့်ဒီအမျိုးအစား" ပြ။
3. **Render audio offline** (အရင်) — progress ၀–၁၅%။
4. **Create Output** → **`addVideoTrack` → `addAudioTrack` (နှစ်ခုလုံး) → `start()`** (အစဉ်မပြောင်းရ) → audio add → frame loop (၁၅–၉၅%) → `finalize()`။
5. **Self-check**: ထွက်လာတဲ့ဖိုင်ကို Mediabunny `Input` နဲ့ ပြန်ဖတ် — track အရေအတွက်၊ duration (±၀.၁s)၊ (audio ပါရင်) audio stream ပါ — **မအောင်ရင် download မပေးဘဲ အမှားပြ**။
6. Save: File System Access (ရရင်) / download fallback။ Cancel = frame loop အတွင်း စစ်၊ `output.cancel()`။
**အဆင့်**: probe→plan→order fix→self-check→UI စာသား (မြန်မာ) → validate script။
**စစ်ဆေးချက်**: `TC-EXP-01` MP4 အသံပါ (ffprobe: 2 stream, duration, audio RMS > −50 dBFS) · `-02` WebM အသံပါ · `-03` AAC မရတဲ့ဟန် (mock) → fallback · `-04` အသံမပါ project · `-05` ၉:၁၆ · `-06` cancel ပြီး ဖိုင်မကျန် · `-07` ၅ မိနစ် project memory မကျော် · `-08` self-check က တမင်ဖျက်ထားတဲ့ဖိုင်ကို ဖမ်းနိုင်။
**Rollback**: export module ကို ယခင် commit သို့။

### S3 — `src{in,out}` + schema v4 (B4) · **L** · မူတည်: မရှိ (အခြေခံ)
**ရည်ရွယ်**: media clip တိုင်းမှာ ဖိုင်ထဲက စ/ဆုံး ကို မှတ် — split/trim/slip မှန်၊ **နောက်မှ keyframe/fx/speed ထပ်ထည့်တာ project ဖိုင်ပုံစံ မပြောင်းရ**။
**Contract**
- Clip (media): `{ id, kind, start, dur, src:{mediaId,in,out}, speed:1, reverse:false, transform:{…default}, fx:[], mask:null, trIn:null, trOut:null, link:null, … }` (L1 §၄.၂)။
- `engine/time.js`: `q(t)`, `fps`, `toFrames`, `fromFrames`; **edit တိုင်း quantize**။
- `engine/clip.js`: `srcTime(clip, t)` (timeline t → source t)၊ `durOf(src, speed)`၊ `clipRangeValid(clip)`။
- `engine/migrate.js`: `migrate(project)` — v1→v3→v4၊ **idempotent**၊ မသိတဲ့ field ထိန်း၊ ဗားရှင်းအသစ်ဆိုရင် "ဒီ app ဗားရှင်းအဟောင်း" အသိပေး။ project ဖွင့်/import တိုင်း `validate()` (မှားရင် ပြင်ပြီး ပြ၊ မဖျက်)။
- **Ops ပြောင်း**: `split` → ဘယ်/ညာ အပိုင်းနှစ်ခုလုံး `src` ခွဲ (ညာ `in += (cut-start)*speed`)၊ `trimLeft` → `in += Δ·speed`၊ `trimRight` → `out`၊ `slip` → `in/out` ရွှေ့ (start/dur မပြောင်း)၊ **in/out ကို media ရဲ့ `[0,dur]` မကျော်**။
- `render/audio/export` အားလုံး `srcTime()` ကိုပဲသုံး (offset ကို ကိုယ်တိုင်မတွက်)။
**အဆင့်**: (၁) time/clip/migrate (pure) + unit၊ (၂) addMedia ကို src ထည့်၊ (၃) split/trim/slip ပြင်၊ (၄) audio.js/export.js ကို srcTime သုံး၊ (၅) အဟောင်း project ဖွင့်တာ e2e။
**စစ်ဆေးချက်**: `known-bugs` B4 PASS · `TC-MDL-01` property test (ကျပန်း op ၁၀၀၀: ∀clip `dur==(out-in)/speed`၊ `0≤in<out≤mediaDur`၊ split ပြီး ပြန်ပေါင်းရင် မူရင်းနဲ့ တူ) · `TC-MDL-02` migrate idempotent + v3 နမူနာ project ၅ ခု · `TC-AUD-01` split ရှေ့/နောက် sample တူ (offline render နှိုင်း)။
**အန္တရာယ်**: အကြီးဆုံး ပြောင်းလဲမှု — branch `fix/s3-source-range`၊ migration ကို အရင်ပေါင်းစပ်၊ **အဟောင်း project ဖွင့်လို့ မပျက်** ဆိုတဲ့ test မဖြစ်မနေ။ **Rollback**: migrate ကို revert (v4 field ကို ပယ်ထားနိုင်)။

### S4 — Audio playback (B5) · **L** · မူတည်: S3
**အမှား**: `<audio>` ကို sync တိုင်း seek (၈/s)။
**ဒီဇိုင်း — `engine/playback.js`**
- **Clock**: `AudioContext.currentTime` ကို master (outputLatency ဖြင့် ညှိ)၊ transport က အဲဒီမှ တွက်။
- `prepare(project)`: media decode cache၊ `start(t)`: t ကို overlap/နောက်မှာ စမယ့် audio clip တိုင်းအတွက် **`AudioBufferSourceNode.start(when, offset=srcTime, dur)`**၊ fade = `GainNode` ramp၊ track gain/mute/solo၊ ducking envelope။
- **Reschedule**: play/seek/edit-during-play (debounce ၅၀ ms)၊ ပြောင်းလဲတဲ့ clip ပဲ ပြန်စီစဉ်။
- **ရှည်တဲ့ media (> ၁၂၀ s)**: AudioBuffer အပြည့်မသိမ်း၊ `<audio>`+`MediaElementSource` ကို **start/seek အချိန်မှာပဲ** `currentTime` ထိ — play နေစဉ် မထိ (drift > ၀.၃ s ရှိမှ ပြင်)။
- Autoplay policy: Play gesture မှာ `resume()`၊ tab ပျောက်/ပြန် (visibilitychange) မှာ pause + time ပြန်ညှိ။
- Voice recording / Record မှ clip ကိုလည်း တူညီစွာ။
**အဆင့်**: pure scheduling math (`planSchedule(project,t)` → list of {clipId, when, offset, dur, gain curve}) ကို အရင်ရေး+unit → player (context ထည့်) → transport ချိတ် → e2e။
**စစ်ဆေးချက်**: `TC-AUD-02` `planSchedule` math (split clip/trim/loop/fade) · `TC-AUD-03` e2e: ၂.၂ s play အတွင်း `HTMLMediaElement.currentTime` ပြင်ကြိမ် ≤ ၃၊ buffer path မှာ ၀ · `TC-AUD-04` seek/play/edit-during-play မှာ အသံ ပြန်စီ · **သင်နားနဲ့** stutter မရှိ (S8)။
**Rollback**: feature flag `playback.engine = 'legacy'`။

### S5 — Lane စည်းမျဉ်း (B7) · **M** · မူတည်: S3
- `engine/lanes.js`: `placeClip(project, kind, start, dur, {prefer}) → {trackId}` — lane ရှိတာထဲ free slot ရှာ၊ မရှိရင် **lane အသစ်** (track kind တူ၊ နာမည် "Text 2"…) ကို ထိပ်မှာဖန်တီး (z-order: အပေါ်လိုက် = အပေါ်ဆုံးပြ)။
- `moveClip` / `addMedia` / `paste` / `duplicate` အားလုံး `placeClip` ကိုသုံး။ **Main (video) track** = ထပ်ရင် insert (နောက်ကို တွန်း) သို့ ပယ် (ပြင်ဆင်ချက်)။
- Empty lane အလိုအလျောက်ရှင်း (kind တစ်ခုလျှင် အနည်းဆုံး lane ၁ ခုကျန်)၊ Undo ပြန်ရင် lane ပါ ပြန်။
**စစ်ဆေးချက်**: known-bugs B7 PASS · `TC-TML-01` property: ကျပန်း move/add ၁၀၀၀ → lane တစ်ခုမှ overlap မရှိ · `TC-TML-02` lane အသစ်/ရှင်း + undo။

### S6 — Audio graph Preview=Export (B6) · **L** · မူတည်: S4
- `engine/audio-graph.js`: `buildGraph(ctx, project, { scheduler })` — track bus (gain/pan/EQ/comp/reverb/echo)၊ ducking၊ limiter၊ master meter **တစ်နေရာထဲမှာပဲ**။ **Preview (live ctx) နဲ့ Export (OfflineAudioContext)** တူညီသော builder၊ ကွာခြားချက် = source scheduling ပဲ (`playback.planSchedule` ကို နှစ်ဖက်စလုံးသုံး)။
- Reverb IR = **seeded** (Math.random မသုံး) → deterministic။ Loop၊ role (voice/music/sfx) ထောက်ပံ့။
**စစ်ဆေးချက်**: `TC-AUD-05` EQ+reverb+duck ဖွင့်ထား project ကို (က) preview-style (OfflineAudioContext ဖြင့်အတု live) (ခ) export render နှစ်မျိုးထုတ် → RMS ≤ ၁ dB၊ spectrum ≤ ၃ dB · `TC-AUD-06` determinism (နှစ်ကြိမ်ထုတ် တူ) · `TC-AUD-07` clipping မရှိ (peak ≤ −၁ dBFS limiter)။

---

## ၃။ Phase T — Timeline v2 (Plan §၅)

### Gesture state machine (T1–T3 အားလုံးအတွက် စံ)
`idle → armed (pointerdown) → [≥ ၃ px move] → dragging{ move | trimL | trimR | slip | slide | roll | box | scrub } → drop|cancel(Esc)`။
- ပထမ ၃ px အတွင်း = click (select)၊ **drag တစ်ခုလုံး = undo ၁ ဆင့်** (transaction)၊ drag အတွင်း store ကို မပြင်ဘဲ **ghost/preview state** ကိုသာပြ၊ drop မှ command တစ်ခုပဲ ခေါ် (မြန်ဆန်/undo သန့်)။
- Auto-scroll (အစွန်း ၃၀ px)၊ Esc = ပယ်၊ locked/hidden track = gesture မစ။
- Snap service (`engine/snap.js`): drag စမှာ snap point စုစည်း (sorted array) → **binary search** ဖြင့် ၈ px အတွင်း အနီးဆုံး၊ guide ပြ။

### T1 — Clip API (`engine/timeline.js` — Command layer) · **L** · မူတည်: S3, S5
**Commands (လက်မှတ်)** — အားလုံး `(store, …) → result`၊ undo label ပါ၊ locked/range စစ်၊ quantize
- `moveClips(ids, dt, {snap, copy, toTrack?})` · `trimClip(id, side, t, {mode:'normal|ripple|roll'})` · `splitClips(ids|atPlayhead, t, {allTracks})` · `slipClip(id, dSrc)` · `slideClip(id, dt)` · `deleteClips(ids, {ripple})` · `duplicateClips(ids)` · `lift(range)` / `extract(range)` · `insertAt(clip, t)` / `overwriteAt(clip, t)` · `setClipProp(id, path, value)` (property/keyframe အတွက်)။
- UI/keyboard/test အားလုံး ဒီ commands ကိုပဲခေါ် (store ကို တိုက်ရိုက်မပြင်)။
**စစ်ဆေးချက်**: `TC-TML-03` command တစ်ခုချင်း property test (invariants: no overlap, dur≥၁ frame, src range, locked မထိ)၊ undo label စာရင်း၊ batch ops (multi) တစ်ကြိမ်တည်း undo။

### T2 — Edit tools · **L** · မူတည်: T1
Razor tool (`B`)၊ ripple trim (Shift)၊ roll (Ctrl)၊ slip (Alt+drag)၊ slide၊ In/Out (`I/O`) + Lift/Extract (`X`/`Shift+X`)၊ Insert vs Overwrite drop၊ main-track magnet (`P`)၊ Delete left/right (`Q/W`)၊ Nudge (←/→)၊ **Split all tracks**။
**စစ်ဆေးချက်**: `TC-TML-04…12` ကိရိယာတစ်ခုချင်း (e2e pointer gesture ပါ — puppeteer mouse)၊ magnet ON/OFF၊ ripple ပြီး စာတန်း/ဖတ်သံ link ကိုက်၊ **Ctrl+Z တိုင်းပြန်**။

### T3 — Selection / Link / Marker · **M** · မူတည်: T1
Multi-select (Shift/Ctrl)၊ box select၊ select-all-right (`Alt+→`)၊ **link group** (`link` field: ဖတ်သံ↔စာတန်း — ရွှေ့/trim/ripple ကို group တစ်ခုလုံးအသုံးချ)၊ Marker (`M`) + snap point၊ ruler မှာပြ။
**စစ်ဆေးချက်**: `TC-TML-13` link ရွှေ့ပြီး စာတန်းလိုက်၊ unlink · `TC-TML-14` marker snap။

### T4 — Playhead / Scrub / Transport · **M** · မူတည်: S4
Audio scrub (၈၀–၁၅၀ ms အသံတို)၊ J/K/L shuttle၊ ←/→ frame၊ ↑/↓ edit point၊ Home/End၊ loop selection (`\`)၊ follow-playhead (Auto/Smooth/Off)၊ ruler ဆွဲ scrub မှာ frame ghosting (နောက်ဆုံး frame ကိုကိုင်ထား)။
**စစ်ဆေးချက်**: `TC-PLY-01…05` · scrub ၂၀၀ ms အတွင်း preview frame update ≤ ၁၀၀ ms။

### T5 — Performance · **L** · မူတည်: T1
**Virtualized timeline** (မျက်နှာပြင်ပေါ်က clip ကိုပဲ render၊ clip component ကို id+version ဖြင့် memo)၊ **Waveform LOD** (`engine/peaks.js`: Worker ကနေ ၁×/၄×/၁၆×/၆၄× pyramid → IndexedDB cache)၊ thumbnail (Worker)၊ rAF coalescing (transport tick ကို Timeline body မ re-render)၊ **Perf HUD** (dev toggle: fps, render ms, clip count)။
**စစ်ဆေးချက်**: `TC-PRF-01` clip ၁၀၀၀ project pan/zoom ≥ ၆၀ fps (Perf HUD၊ headless trace)၊ `-02` ၅ မိနစ်ကဗျာ preview ≥ ၃၀ fps၊ `-03` project ဖွင့် ≤ ၃ s၊ `-04` memory (ဖတ်သံ ၁၀ မိနစ် + Music ၅ မိနစ်) < ၂ GB။

### T6 — Caption lane tools · **M** · မူတည်: T1, T3
Inline edit (double-click)၊ စာရင် ↔ timeline sync၊ bulk nudge (±frame/၁s)၊ ripple captions (ဒီနေရာကနောက်အားလုံး)၊ **snap-to-voice** (VAD phrase marker ကိုပြ)၊ confidence အရောင် (အနီ/ဝါ/စိမ်း)၊ Review next (`R`)၊ Lock (`L`)၊ **စာသား မပြောင်း (invariant)**။
**စစ်ဆေးချက်**: `TC-CAP-01…06`၊ L2 §၆ corpus ကို caption ops အားလုံးမှာ မပျက်။

---

## ၄။ E1 — Export parity (M1 ရဲ့ နောက်ဆုံးအစိတ်အပိုင်း) · **M** · မူတည်: S2, S6, T1
- `scripts/validate-export.mjs`: project နမူနာ ၅ ခု (စာသီးသန့်၊ ဖတ်သံ၊ ဖတ်သံ+Music+ducking၊ split/trim ပြီး၊ ၉:၁၆) ကို headless export → ffprobe (stream/duration/drift)၊ `ffmpeg -af astats` (RMS/peak)၊ frame hash (စာတန်းပါ frame ကို Preview canvas နဲ့ နှိုင်း ≤ ၁% pixel diff)။
- Export dialog: preset (YouTube 1080p / Reels 9:16 / 720p)၊ ဘာကြောင့်ဒီ codec ပြ၊ ETA၊ cancel၊ **self-check ရလဒ်ပြ**။
- ၁/၅/၁၀ မိနစ် export ကို သင့်စက်မှာ time/memory တိုင်း (`docs/benchmarks.md` မှာမှတ်)။
**စစ်ဆေးချက်**: X2 အားလုံး + `TC-EXP-09…12`။

---

## ၅။ Branch / PR / Review စည်းမျဉ်း (M1 အတွက်)

- Branch: `fix/s1-myanmar-integrity`, `fix/s2-export-audio`, `fix/s3-source-range`, `fix/s4-playback`, `fix/s5-lanes`, `fix/s6-audio-graph`, `feat/t1-commands`, … **WP တစ်ခု = PR တစ်ခု** (≤ ~၄၀၀ လိုင်းပြောင်း၊ ကျော်ရင် ခွဲ)။
- PR template: ရည်ရွယ်ချက်၊ ပြောင်းတဲ့ဖိုင်၊ စစ်ဆေးချက် (TC-ID + ရလဒ်)၊ screenshot/ffprobe output၊ `known-bugs` ပြောင်းလဲမှု၊ rollback နည်း၊ **Plan §၂ status ပြင်ထားခြင်း**။
- Merge အချက်: CI စိမ်း + (UI ပါရင်) သင်၏ "ကိုက်ပါတယ်" ဒါမှမဟုတ် screenshot အတည်ပြု။ **main ကို တိုက်ရိုက်မရေး** (docs မှလွဲ)။
- ပြိုင်ရေးမှု ကာကွယ်: PR မဖွင့်ခင် `main` နောက်ဆုံးကို ပေါင်းထည့်၊ တခြား session ကိုလည်း branch နာမည် ကြေညာ (Plan §၃(1))။

---

## ၆။ အချိန်/အရွယ် ခန့်မှန်း (ကျွန်တော့် မျှော်မှန်း — လူ/AI ကွာနိုင်)

| WP | အရွယ် | မှတ်ချက် |
|---|---|---|
| S7 | S | အမြန်ဆုံး၊ အစောဆုံး |
| S1 | M | vendor + banner + corpus |
| S2 | M | pipeline order + self-check |
| S3 | L | အကြီးဆုံး၊ migration |
| S4 | L | scheduling + long media path |
| S5 | M | lane algorithm |
| S6 | L | graph ပေါင်းစည်း + parity test |
| T1 | L | command layer |
| T2 | L | gesture ပေါင်းများ |
| T3 | M | |
| T4 | M | audio scrub |
| T5 | L | virtualization + worker |
| T6 | M | |
| E1 | M | validate script + dialog |
| S8 | S | သင်စစ်ချိန် |
စုစုပေါင်း ≈ **L × ၆ + M × ၇ + S × ၂** — M1 အပြည့်အဝကို အဆင့်ဆင့် merge နဲ့။

---

## ၇။ M1 အတွက် စစ်ဆေးမှု အတည်ပြုစာရင်း (နောက် L4 မှာ အပြည့်စုံ)

| ကဏ္ဍ | Test IDs (အကျဉ်း) |
|---|---|
| မြန်မာစာ | TC-TXT-01…04 |
| Model/Migration | TC-MDL-01…02 |
| Audio | TC-AUD-01…07 |
| Export | TC-EXP-01…12 |
| Timeline | TC-TML-01…14 |
| Playhead | TC-PLY-01…05 |
| Caption | TC-CAP-01…06 |
| Perf | TC-PRF-01…04 |
| User regression | S8 စာရင်း (L4) |
