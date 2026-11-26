/* 장기 전용 효과음. 나무의 짧은 공명과 뜯는 현의 잔향을 합성합니다. */
(() => {
  const sampleRate = 32000;
  const note = midi => 440 * 2 ** ((midi - 69) / 12);
  const D = 62, E = 64, G = 67, A = 69, C = 72;

  function render(cue) {
    const duration = {
      menu: .09, back: .15, select: .11, invalid: .17, undo: .33,
      move: .29, heavy: .33, capture: .41, check: .46, counter: .53,
      clear: .45, pass: .34, start: 1.18, win: 1.72, lose: 1.56
    }[cue];
    if (!duration) return null;
    const samples = new Float32Array(Math.ceil(duration * sampleRate));
    let seed = 18749;

    function partial(at, hz, decay, level, attack = .0016, bend = 0) {
      const start = Math.round(at * sampleRate);
      const count = Math.min(samples.length - start, Math.ceil(decay * 7 * sampleRate));
      const fall = Math.exp(-1 / (decay * sampleRate));
      const bendFall = Math.exp(-1 / (.022 * sampleRate));
      let phase = 0;
      let envelope = level;
      for (let i = 0; i < count; i++) {
        const fadeIn = Math.min(1, i / (attack * sampleRate));
        samples[start + i] += Math.sin(phase) * envelope * fadeIn;
        phase += 2 * Math.PI * (hz + bend) / sampleRate;
        envelope *= fall;
        bend *= bendFall;
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
        samples[start + i] += (top - bottom) * envelope * Math.min(1, i / 28);
        envelope *= fall;
      }
    }

    function wood(at, hz, level) {
      partial(at, hz, .029, .61 * level, .0014, hz * .08);
      partial(at, hz * 2.73, .014, .35 * level);
      partial(at, hz * 5.19, .008, .2 * level);
      texture(at, .009, .56 * level, 4300, 530);
    }

    function drum(at, level) {
      partial(at, 145, .074, .71 * level, .002, 36);
      partial(at, 413, .028, .33 * level, .002, 24);
      texture(at, .018, .74 * level, 2300, 290);
    }

    function chime(at, level) {
      partial(at, 657, .111, .52 * level);
      partial(at, 1079, .048, .37 * level);
      partial(at, 1562, .038, .31 * level);
    }

    function pluck(at, midi, level) {
      const hz = note(midi);
      partial(at, hz, .22, .55 * level, .004, hz * .019);
      partial(at, hz * 2.004, .115, .34 * level, .002, hz * .015);
      partial(at, hz * 3.006, .075, .24 * level);
      partial(at, hz * 4.03, .05, .095 * level);
      texture(at, .013, .37 * level, 3550, 460);
      partial(at + .018, hz * 1.003, .24, .18 * level, .008);
      partial(at + .081, hz * .997, .17, .07 * level, .012);
    }

    switch (cue) {
      case "menu": wood(0, 680, .115); break;
      case "back": wood(0, 470, .12); break;
      case "select": texture(0, .012, .14, 4800, 900); wood(.014, 620, .16); break;
      case "invalid": wood(0, 295, .19); wood(.07, 233, .12); break;
      case "undo":
        texture(0, .035, .19, 2950, 210);
        wood(.075, 370, .23);
        wood(.159, 510, .13);
        break;
      case "move":
      case "heavy":
      case "capture": {
        const hit = cue === "capture";
        const heavy = cue !== "move";
        texture(.018, .043, heavy ? .25 : .19, 3200, 280);
        if (hit) wood(.091, 570, .38);
        wood(.133, heavy ? 263 : 367, hit ? .57 : heavy ? .46 : .36);
        wood(.169, heavy ? 306 : 422, hit ? .21 : .11);
        break;
      }
      case "check": drum(0, .46); drum(.132, .29); chime(.132, .36); break;
      case "counter": drum(0, .31); wood(.081, 470, .24); drum(.178, .51); chime(.178, .37); break;
      case "clear": pluck(0, A, .19); pluck(.125, D + 12, .19); break;
      case "pass": wood(0, 321, .19); pluck(.095, E, .17); break;
      case "start":
        drum(.012, .35);
        pluck(.09, D, .43); pluck(.239, G, .35); pluck(.39, A, .39);
        break;
      case "win":
        drum(0, .39);
        pluck(.081, D, .40); pluck(.223, G, .32); pluck(.348, A, .36);
        pluck(.527, C, .34); pluck(.676, D + 12, .44);
        pluck(.692, D, .23); chime(.676, .21);
        break;
      case "lose":
        drum(.013, .26);
        pluck(.119, A - 12, .29); pluck(.301, G - 12, .24); pluck(.546, D - 12, .30);
        break;
    }

    const fade = Math.round(.025 * sampleRate);
    for (let i = samples.length - fade; i < samples.length; i++) {
      samples[i] *= (samples.length - 1 - i) / fade;
    }
    return samples;
  }

  window.JanggiSound = window.FX?.createSamplePlayer?.(render, sampleRate);
})();
