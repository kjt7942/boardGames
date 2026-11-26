/* 공통 메뉴 시트: 홈 · 전체화면 · 소리 · 규칙 · 새 게임을 아래에서 올라오는 시트 하나로 모읍니다.
   각 화면은 BGMenu.set({ home, snd, sndOn, rules, newGame, confirm:{home,new} }) 로 동작을 등록하고
   버튼에서 BGMenu.open() 만 부르면 돼요. confirm.* 는 확인 문구를 돌려주면(없으면 null) 한 번 더 물어봐요. */
(() => {
  const base = new URL("./", document.currentScript.src);
  const icon = name => new URL("img/ui/" + name + ".webp", base).href;
  let cfg = {};
  let root, grid, confirmBox, lastFocus;

  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  };
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const sfx = name => { try { window.FX && FX.sfx(name); } catch (e) { } };
  const toggleFull = async () => {
    try {
      if (isFull()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
    } catch (e) { }
  };
  const canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

  const items = () => [
    { key: "home", label: "홈", icon: "home", run: () => cfg.home && cfg.home() },
    canFull && { key: "fs", label: isFull() ? "전체화면 해제" : "전체화면", icon: "fs", run: toggleFull },
    { key: "snd", label: cfg.sndOn && cfg.sndOn() ? "소리 끄기" : "소리 켜기", icon: cfg.sndOn && cfg.sndOn() ? "snd_on" : "snd_off", run: () => cfg.snd && cfg.snd(), stay: true },
    { key: "rules", label: "규칙", icon: "rules", run: () => cfg.rules && cfg.rules() },
    { key: "new", label: "새 게임", icon: "new", run: () => cfg.newGame && cfg.newGame() }
  ].filter(Boolean);

  // 스타일을 이 파일에 함께 둬서, 다른 CSS가 예전 것으로 캐시돼 있어도 시트가 항상 제대로 보여요
  const SHEET_CSS = `
.bgm { position: fixed; inset: 0; z-index: 120; font-family: system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
.bgm[hidden] { display: none; }
.bgm-dim { position: absolute; inset: 0; background: #0a1450aa; }
.bgm-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: 560px;
  margin: 0 auto;
  padding: 8px 16px calc(18px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #fff8ea, #fff1d6);
  border: 4px solid #fff;
  border-bottom: 0;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 0 0 4px #2f7bf0;
  color: #1d2550;
  animation: bgmUp .22s ease-out;
}
@keyframes bgmUp { from { transform: translateY(100%); } }
.bgm-grab { width: 44px; height: 5px; margin: 0 auto 8px; border-radius: 3px; background: #c9cfe6; }
.bgm-sheet h2 { margin: 0 0 10px; text-align: center; font-size: 1.15rem; font-weight: 900; color: #1d2550; }
.bgm-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
.bgm button.bgm-item {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 8px 2px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: #1d2550;
  font: inherit;
  font-size: .78rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
}
.bgm-item img { width: 52px; height: 52px; }
.bgm button.bgm-item:hover, .bgm button.bgm-item:focus-visible { background: #e8eeff; }
.bgm-item:active { transform: scale(.95); }
.bgm-confirm { text-align: center; padding: 4px 0 6px; }
.bgm-confirm p { margin: 0 0 14px; font-size: 1rem; font-weight: 800; line-height: 1.5; word-break: keep-all; }
.bgm-confirm-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bgm .bgm-confirm-btns button { min-height: 48px; border: 0; border-radius: 14px; font: inherit; font-weight: 900; font-size: 1rem; cursor: pointer; }
.bgm .bgm-no { background: #e3ebff; color: #2a3a8a; }
.bgm .bgm-ok { background: linear-gradient(180deg, #55baff, #1f6bf0); color: #fff; box-shadow: 0 3px 0 #1747b3; }
@media (min-width: 700px) { .bgm-item img { width: 60px; height: 60px; } .bgm-item { font-size: .85rem; } }
.bgm-grid[hidden], .bgm-confirm[hidden] { display: none; }
`;

  function build() {
    if (!document.getElementById("bgm-style")) {
      const style = document.createElement("style");
      style.id = "bgm-style";
      style.textContent = SHEET_CSS;
      document.head.append(style);
    }
    root = el("div", "bgm");
    root.hidden = true;
    root.innerHTML = '<div class="bgm-dim"></div><div class="bgm-sheet" role="dialog" aria-modal="true" aria-label="메뉴">' +
      '<div class="bgm-grab"></div><h2>메뉴</h2><div class="bgm-grid"></div>' +
      '<div class="bgm-confirm" hidden><p></p><div class="bgm-confirm-btns"><button type="button" class="bgm-no">취소</button><button type="button" class="bgm-ok">계속</button></div></div></div>';
    document.body.append(root);
    grid = root.querySelector(".bgm-grid");
    confirmBox = root.querySelector(".bgm-confirm");
    root.querySelector(".bgm-dim").onclick = close;
    root.querySelector(".bgm-no").onclick = () => { sfx("uiNo"); render(); };
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !root.hidden) close(); });
    document.addEventListener("fullscreenchange", () => { if (!root.hidden) render(); });
  }

  function render() {
    confirmBox.hidden = true;
    grid.hidden = false;
    grid.replaceChildren();
    for (const item of items()) {
      const button = el("button", "bgm-item");
      button.type = "button";
      button.append(Object.assign(el("img"), { src: icon(item.icon), alt: "", width: 56, height: 56 }), el("span", "", item.label));
      button.onclick = () => choose(item);
      grid.append(button);
    }
  }

  function choose(item) {
    sfx(item.key === "snd" ? (cfg.sndOn && cfg.sndOn() ? "toggleOff" : "toggleOn") : "tap");
    const ask = cfg.confirm && cfg.confirm[item.key];
    const message = ask && ask();
    if (message) {
      grid.hidden = true;
      confirmBox.hidden = false;
      confirmBox.querySelector("p").textContent = message;
      confirmBox.querySelector(".bgm-ok").onclick = () => { sfx("uiOk"); close(true); item.run(); };
      confirmBox.querySelector(".bgm-ok").focus();
      return;
    }
    if (item.stay) { item.run(); render(); return; }
    close();
    item.run();
  }

  function open() {
    if (!root) build();
    lastFocus = document.activeElement;
    sfx("menuOpen");
    render();
    root.hidden = false;
    grid.querySelector("button")?.focus({ preventScroll: true });
  }

  function close(silent) {
    if (!root) return;
    if (silent !== true && !root.hidden) sfx("menuClose");
    root.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.BGMenu = { set: next => { cfg = next || {}; }, open, close };
})();
