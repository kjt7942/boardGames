/* 장기 전용 효과음. 마른 나무가 맞닿을 때의 짧은 공명을 합성합니다. */
(() => {
  const sampleRate = 32000;

  function render(cue) {
    const duration = {
      menu: .07, back: .075, invalid: .16, undo: .22,
      move: .065, heavy: .072, capture: .079, start: .235, win: .43, lose: .28
    }[cue];
    if (!duration) return null;
    const samples = new Float32Array(Math.ceil(duration * sampleRate));
    let seed = 18749;

    function partial(at, hz, decay, level) {
      const start = Math.round(at * sampleRate);
      const count = Math.min(samples.length - start, Math.ceil(decay * 7 * sampleRate));
      const fall = Math.exp(-1 / (decay * sampleRate));
      let phase = 0;
      let envelope = level;
      for (let i = 0; i < count; i++) {
        const fadeIn = Math.min(1, i / 16);
        samples[start + i] += Math.sin(phase) * envelope * fadeIn;
        phase += 2 * Math.PI * hz / sampleRate;
        envelope *= fall;
      }
    }

    function texture(at, decay, level, high, low) {
      const start = Math.round(at * sampleRate);
      const count = Math.min(samples.length - start, Math.ceil(decay * 7 * sampleRate));
      const bright = 1 - Math.exp(-2 * Math.PI * high / sampleRate);
      const dark = 1 - Math.exp(-2 * Math.PI * low / sampleRate);
      const fall = Math.exp(-1 / (decay * sampleRate));
      let envelope = level, top = 0, bottom = 0;
      for (let i = 0; i < count; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const white = seed / 0x80000000 - 1;
        top += bright * (white - top);
        bottom += dark * (white - bottom);
        samples[start + i] += (top - bottom) * envelope * Math.min(1, i / 12);
        envelope *= fall;
      }
    }

    function wood(at, hz, level) {
      // 같은 시점에 짧은 접촉음과 나무 몸체의 공명이 함께 시작합니다.
      texture(at, .0032, .85 * level, 6800, 900);
      partial(at, hz, .012, .59 * level);
      partial(at, hz * 2.51, .007, .37 * level);
      partial(at, hz * 4.73, .0038, .24 * level);
    }

    switch (cue) {
      case "menu": wood(0, 680, .11); break;
      case "back": wood(0, 475, .13); break;
      case "invalid": wood(0, 340, .2); wood(.08, 285, .12); break;
      case "undo": wood(0, 390, .21); wood(.12, 490, .15); break;
      case "move": wood(0, 423, .57); break;
      case "heavy": wood(0, 329, .65); break;
      case "capture": wood(0, 370, .76); break;
      case "start": wood(0, 335, .34); wood(.14, 460, .4); break;
      case "win": wood(0, 355, .39); wood(.125, 445, .43); wood(.29, 535, .5); break;
      case "lose": wood(0, 430, .34); wood(.17, 305, .32); break;
    }

    const fade = Math.round(.012 * sampleRate);
    for (let i = samples.length - fade; i < samples.length; i++) {
      samples[i] *= (samples.length - 1 - i) / fade;
    }
    return samples;
  }

  window.JanggiSound = window.FX?.createSamplePlayer?.(render, sampleRate);
})();
