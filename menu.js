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

  function build() {
    root = el("div", "bgm");
    root.hidden = true;
    root.innerHTML = '<div class="bgm-dim"></div><div class="bgm-sheet" role="dialog" aria-modal="true" aria-label="메뉴">' +
      '<div class="bgm-grab"></div><h2>메뉴</h2><div class="bgm-grid"></div>' +
      '<div class="bgm-confirm" hidden><p></p><div class="bgm-confirm-btns"><button type="button" class="bgm-no">취소</button><button type="button" class="bgm-ok">계속</button></div></div></div>';
    document.body.append(root);
    grid = root.querySelector(".bgm-grid");
    confirmBox = root.querySelector(".bgm-confirm");
    root.querySelector(".bgm-dim").onclick = close;
    root.querySelector(".bgm-no").onclick = render;
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
    const ask = cfg.confirm && cfg.confirm[item.key];
    const message = ask && ask();
    if (message) {
      grid.hidden = true;
      confirmBox.hidden = false;
      confirmBox.querySelector("p").textContent = message;
      confirmBox.querySelector(".bgm-ok").onclick = () => { close(); item.run(); };
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
    render();
    root.hidden = false;
    grid.querySelector("button")?.focus({ preventScroll: true });
  }

  function close() {
    if (!root) return;
    root.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.BGMenu = { set: next => { cfg = next || {}; }, open, close };
})();
