# UX Spec · Part 0 — မူများ၊ State စာရင်း၊ Token၊ Motion၊ Glossary

ဒီ Part က **UX spec ရဲ့ အခြေခံ** (အခြား Part ၁–၇ အားလုံး ဒီကို ကိုးကား)။ Acceptance ID ပုံစံ: `UX-<ဧရိယာ>-<နံပါတ်>` (L4 test catalog မှာ TC နဲ့ ချိတ်မယ်)။
**ကိုးကားစံ**: CapCut desktop ရဲ့ အပြုအမူ/ခံစားမှု (မူရင်းကို မကူး — ရုပ်ရည်/icon/စာသား ကိုယ်ပိုင်)။ `[A]` = ကျွန်တော့် ယူဆချက် (သင်အတည်ပြု/ပြင်ရန်)။

---

## ၀.၁ UX မူ ၁၂ ချက် (ဆုံးဖြတ်ရာမှာ အရင်ကြည့်)

| # | မူ | အဓိပ္ပာယ် / စစ်နည်း |
|---|---|---|
| P1 | **Selection-driven** | ရွေးထားတာနဲ့ ဆိုင်တာကိုပဲ Inspector/Floating toolbar မှာပြ။ (စစ်: clip ၅ မျိုးရွေးပြီး tab/control စာရင်း မှန်) |
| P2 | **Direct manipulation** | လုပ်လို့ရတာကို ဖြစ်နိုင်ရင် Player/Timeline ပေါ်မှာ တိုက်ရိုက်ဆွဲ/နှိပ်ပြီး လုပ်ခွင့်၊ dialog မခေါ်ရ |
| P3 | **Undo ၁၀၀%** | edit တိုင်း undo label ပါ၊ drag/slider တစ်ခုလုံး = ၁ ဆင့်၊ destructive ကို confirm မလို (project/file ဖျက်မှ confirm) |
| P4 | **Non-destructive** | မူရင်းဖိုင်မထိ၊ `src{in,out}` ဖြင့်ဖြတ် |
| P5 | **Predictable** | gesture/shortcut တူရင် ဘယ်နေရာမှာမဆို ရလဒ်တူ (ဥပမာ Delete = ဖျက်၊ Shift = ripple) |
| P6 | **Feedback ချက်ချင်း** | ၁၀၀ ms အတွင်း မြင်ရ (hover/press/drag)၊ ၁ s ကျော် = progress+cancel |
| P7 | **Empty ≠ အလွတ်** | empty state တိုင်း CTA တစ်ခု၊ ဘာမှမရှိတဲ့ panel မပြ |
| P8 | **အမှားကို ရှင်းပြ** | ဘာဖြစ်လဲ + ဘာလုပ်ရမလဲ (မြန်မာ) + လိုရင် "Copy diagnostics" |
| P9 | **Burmese-first microcopy** | label = English (နမူနာကိုက်)၊ tooltip/toast/error/empty/dialog = မြန်မာ |
| P10 | **Keyboard-complete** | mouse မပါဘဲ အဓိကအလုပ် (ဖြတ်/ရွှေ့/စာထည့်/export) လုပ်လို့ရ |
| P11 | **Layout မရွေ့** | loading/ပြောင်းလဲမှုကြောင့် ခလုတ်နေရာ မရွေ့၊ scrollbar အလွန်အကျွံ မပေါ် |
| P12 | **မြန်မာစာ မပျက်** | UI က အသုံးပြုသူစာကို မပြောင်း/မဖြတ်/မဖျော့ (ellipsis ဖြတ်ရင် syllable မကျိုး) |

---

## ၀.၂ Interactive component State catalogue

**Component အားလုံးမှာ state ၉ မျိုး သတ်မှတ်** (မပါတာ = bug):
| State | ပုံစံ (token) | မှတ်ချက် |
|---|---|---|
| default | `--field` နောက်ခံ၊ `--tx` စာ | |
| hover | နောက်ခံ `--field2`၊ ၁၂၀ ms ease-out | cursor သင့်လျော်စွာ |
| pressed/active | နောက်ခံ `--accent-soft` + scale .98 (ခလုတ်သာ) | |
| **focus-visible** | **၂ px `--accent` ring၊ offset ၂ px** | keyboard သာ (mouse click မှာမပြ) |
| selected/on | `--accent-soft` + `--accent2` စာ/icon | rail, chip, segmented |
| disabled | opacity .45၊ cursor `not-allowed`၊ **tooltip မှာ အကြောင်းရင်း** | "ရွေးပါ" စသည် |
| loading | skeleton (list/grid) သို့ spinner (ခလုတ်) | layout size မပြောင်း |
| error | border `--danger`၊ အောက်မှာ မြန်မာစာ message၊ icon ⚠ | input, dialog field |
| drag-over / drop-target | အပြာ dashed ဘောင်/အပြာမျဉ်း | panel/timeline/player |

**Drag states**: idle → armed (≤ ၃ px) → dragging (ghost ၀.၇၅ opacity, cursor `grabbing`) → drop-valid (အပြာ) / drop-invalid (အနီ + cursor `no-drop`) → committed / cancelled (Esc)။

---

## ၀.၃ Token spec (ရှိပြီး + ထပ်ဖြည့်)

**Colour roles** (dark/light — တန်ဖိုး `styles.css` မှာ): page/panel/panel2/line/field/field2/tx/mut/dim/accent/accent2/accent-soft/accent-line။
**ထပ်ထည့်**: `--success #3ec28f` · `--warn #e8b64a` · `--danger #ff6b7a` · `--info --accent2` · `--selection-outline #fff + 2px --accent` · `--snap-guide #ff4fa3` (ပန်းရောင်၊ Player/Timeline) · `--marker #ffb02e` · `--keyframe #ffd166` · `--link #7fd6ff`။
**Clip colours**: Text `#6553ca→#7d6ae0`၊ Video အပြာ (thumbnail strip)၊ Image အပြာပျော့၊ Audio-voice အစိမ်းရင့်+waveform `#7fe3c6`၊ Audio-music ခရမ်းစိမ်း၊ SFX ပန်းရောင်၊ Sticker/Shape လိမ္မော်၊ Effect/Adjust ပန်းရောင်-ခရမ်း၊ Caption (confidence): စိမ်း≥.8 / ဝါ .5–.8 / အနီ<.5။
**Spacing scale**: 4·8·12·16·24·32 px · **Radius**: 6 (input) · 8 (button) · 10–12 (panel/dialog) · **Border** 1 px `--line`။
**Typography**: UI = Inter-like sans 13/12/11 (small caps မသုံး)၊ heading 14–16 semibold၊ **Burmese**: `Noto Sans Myanmar` fallback `Padauk`၊ **line-height ≥ 1.6** (Burmese စာကြောင်း၊ သရတွေ မဖြတ်ကျအောင်)၊ letter-spacing 0၊ UPPERCASE transform မသုံး၊ ဂဏန်း = Latin digits (time/နံပါတ်)၊ မြန်မာဂဏန်းက content (စာသား) ထဲမှာပဲ။
**Z-index layers**: panel 1 · timeline overlay (playhead/snap) 10 · player overlay 12 · splitter 20 · dropdown/context 50 · dialog 60 · toast 70 · tooltip 80 · coach mark 90။
**Min hit target**: ၂၈×၂၈ px (icon button ၃၂)၊ timeline trim zone ၉ px (ကျဉ်းရင် ၆)၊ touch မပံ့ပိုး (pointer သာ)။

---

## ၀.၄ Motion spec

| Motion | ကြာချိန် | Easing | မှတ်ချက် |
|---|---|---|---|
| hover/press | ၁၂၀ ms | ease-out | |
| panel collapse/expand, splitter snap | ၁၈၀ ms | ease-in-out | layout ကူးပြောင်းချိန် content reflow မလုပ် |
| dialog in/out | ၂၄၀ ms (fade+scale .98→1) | ease-out | |
| toast | in ၁၈၀ / stay ၃ s (error ၆ s) / out ၁၂၀ | | hover = pause |
| tooltip | delay ၅၀၀ ms၊ hide ၀ | | rail/icon-only မှာ ၂၅၀ ms |
| playhead/scrub | **ချက်ချင်း** (animation မရှိ) | | |
| drag ghost follow | ချက်ချင်း | | |
| waveform/thumbnail reveal | fade ၁၂၀ ms | | |
**Reduced motion** (`prefers-reduced-motion`): duration ၀၊ scale မသုံး၊ playback ကိုမထိ။

---

## ၀.၅ Glossary — UI စကားလုံး (EN label · မြန်မာ tooltip/ရှင်းလင်းချက်) `[A]`

> မူ: **နည်းပညာစကားလုံးကို English အတိုင်းထား** (CapCut/ဗီဒီယိုတည်းဖြတ်သူ အကျင့်)၊ **မြန်မာ = ရှင်းလင်းချက်/tooltip**။

| EN (label) | မြန်မာ tooltip | | EN | မြန်မာ tooltip |
|---|---|---|---|---|
| Project | ပရောဂျက် (တည်းဖြတ်နေတဲ့ ဖိုင်) | | Keyframe | ◆ အချိန်တစ်ခုမှာ တန်ဖိုးမှတ် |
| Clip | ထရက်ပေါ်က အပိုင်းတစ်ခု | | Caption | စာတန်း (ဗီဒီယိုပေါ်စာ) |
| Track | ထရက် (အလွှာ) | | Template | ပုံစံအသင့် |
| Timeline | အချိန်လိုင်း | | Preset | သတ်မှတ်ပြီး ပုံစံ |
| Playhead | ကြည့်နေတဲ့အချိန်နေရာ | | Mask | ဖုံးအုပ်ပုံစံ (ပုံတစ်စိတ်ပဲပြ) |
| Split | ဖြတ် (အပိုင်းနှစ်ခုခွဲ) | | Transition | အပိုင်းကူးပြောင်းပုံ |
| Trim | အစွန်းတိုစေ/ရှည်စေ | | Filter | အရောင်ပုံစံ |
| Ripple | ဖျက်ပြီး ကွက်လပ်ပိတ် | | Adjust | အလင်း/အရောင်ညှိ |
| Snap | ကပ် (အနားကပ်ခြင်း) | | Speed | အမြန်နှုန်း |
| Magnet | Main track ကွက်လပ်မကျန်အောင် ကပ် | | Fade | တဖြည်းဖြည်း ထွက်/ဝင် |
| Marker | အမှတ်အသား | | Ducking | ဖတ်သံပေါ်လာရင် Music ချ |
| Link | ချိတ် (အတူရွှေ့) | | Export | ဗီဒီယိုထုတ် (MP4) |
| Overlay | အပေါ်ထပ်ပုံ/စာ | | Draft / Review / Locked | မူကြမ်း / ပြန်စစ်ရန် / လော့ခ် |

---

## ၀.၆ Acceptance (Part 0)

- **UX-ST-01** component library ထဲက interactive component တိုင်း state ၉ မျိုးကို storybook-လိုစာမျက်နှာ (`/v2/dev/components.html`) မှာ ပြ၊ screenshot နှိုင်း (dark/light)။
- **UX-ST-02** focus ring ကို keyboard Tab နဲ့ element တိုင်းမှာ မြင်ရ၊ mouse click မှာမပေါ်။
- **UX-ST-03** Disabled ခလုတ်တိုင်း tooltip မှာ အကြောင်းရင်း (မြန်မာ) ပါ။
- **UX-ST-04** AA contrast (≥ ၄.၅:၁ စာ၊ ≥ ၃:၁ icon) dark/light နှစ်မျိုးလုံး (automated check)။
- **UX-ST-05** မြန်မာစာ UI (tooltip/toast) မှာ သရ/သတ် မဖြတ်ကျ (line-height ≥ ၁.၆၊ ellipsis syllable မကျိုး) — screenshot စစ်။
- **UX-ST-06** `prefers-reduced-motion` မှာ animation ပိတ်။
