// Visual transition math shared by preview and export; one function per type, pure.
export const TRANSITION_TYPES = ['none', 'fade', 'slide', 'zoom', 'wipe', 'blur', 'rise', 'spin', 'dip'];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function transitionFx({ inType = 'none', outType = 'none', inProgress = 1, outProgress = 1 }, cw = 1920, ch = 1080) {
  const fx = { alpha: 1, dx: 0, dy: 0, scale: 1, blur: 0, wipe: 1, rot: 0 };
  const p = clamp01(inProgress), q = clamp01(outProgress);
  const apply = (type, k, sign) => {
    if (type === 'fade' || type === 'dip') fx.alpha *= k;
    else if (type === 'slide') fx.dx += sign * (1 - k) * cw;
    else if (type === 'rise') { fx.dy += sign * (1 - k) * ch * 0.25; fx.alpha *= k; }
    else if (type === 'zoom') { fx.scale *= 0.85 + 0.15 * k; fx.alpha *= k; }
    else if (type === 'spin') { fx.rot += sign * (1 - k) * 6; fx.scale *= 0.9 + 0.1 * k; fx.alpha *= k; }
    else if (type === 'blur') { fx.blur += (1 - k) * 12; fx.alpha *= k; }
    else if (type === 'wipe') fx.wipe = Math.min(fx.wipe, k);
  };
  apply(inType, p, 1);
  apply(outType, q, -1);
  return fx;
}

export const TRANSITION_NAMES = {
  none: 'မရှိ', fade: 'Fade', slide: 'Slide', zoom: 'Zoom', wipe: 'Wipe', blur: 'Blur', rise: 'Rise', spin: 'Spin', dip: 'Dip',
};
