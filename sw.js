// 보드게임즈 서비스 워커: 네트워크 우선(항상 최신), 오프라인이면 저장본 사용
const CACHE = "boardgames-v56";
const FILES = ["./", "index.html", "manifest.json", "net.js", "firebase-config.js",
  "magic-labyrinth/", "magic-labyrinth/index.html", "wall-go/", "wall-go/index.html",
  "janggi/", "janggi/index.html", "janggi/engine.js", "janggi/sound.js", "janggi/wood-sample.js", "baduk/", "baduk/index.html", "baduk/engine.js", "omok/", "omok/index.html", "omok/engine.js", "chess/", "chess/index.html", "chess/engine.js", "onecard/", "onecard/index.html", "thief/", "thief/index.html", "blackjack/", "blackjack/index.html", "minhwatu/", "minhwatu/index.html", "codebreak/", "codebreak/index.html", "memory/", "memory/index.html", "matgo/", "matgo/index.html", "cardkit.js", "cardart.js", "fx.js", "hwatu.webp", "trump.webp", "img/baduk.webp", "img/ban_baduk.webp", "img/ban_blackjack.webp", "img/ban_chess.webp", "img/ban_codebreak.webp", "img/ban_janggi.webp", "img/ban_lobby.webp", "img/ban_matgo.webp", "img/ban_maze.webp", "img/ban_memory.webp", "img/ban_minhwatu.webp", "img/ban_omok.webp", "img/ban_onecard.webp", "img/ban_thief.webp", "img/ban_wallgo.webp", "img/chess.webp", "img/chest.webp", "img/draw_mascot.webp", "img/hero.webp", "img/janggi.webp", "img/lose_mascot.webp", "img/mascot.webp", "img/maze.webp", "img/th_baduk.webp", "img/th_blackjack.webp", "img/th_cards.webp", "img/th_chess.webp", "img/th_codebreak.webp", "img/th_janggi.webp", "img/th_matgo.webp", "img/th_maze.webp", "img/th_memory.webp", "img/th_minhwatu.webp", "img/th_omok.webp", "img/th_onecard.webp", "img/th_thief.webp", "img/th_wallgo.webp", "img/win_mascot.webp", "theme.js", "img/bg_sky.webp", "menu.js", "img/maze\bg_tall.webp", "img/maze\bg_wide.webp", "img/maze\pawn_0.webp", "img/maze\pawn_1.webp", "img/maze\pawn_2.webp", "img/maze\pawn_3.webp", "img/maze\sym_0.webp", "img/maze\sym_1.webp", "img/maze\sym_10.webp", "img/maze\sym_11.webp", "img/maze\sym_12.webp", "img/maze\sym_13.webp", "img/maze\sym_14.webp", "img/maze\sym_15.webp", "img/maze\sym_16.webp", "img/maze\sym_17.webp", "img/maze\sym_18.webp", "img/maze\sym_19.webp", "img/maze\sym_2.webp", "img/maze\sym_20.webp", "img/maze\sym_21.webp", "img/maze\sym_22.webp", "img/maze\sym_23.webp", "img/maze\sym_3.webp", "img/maze\sym_4.webp", "img/maze\sym_5.webp", "img/maze\sym_6.webp", "img/maze\sym_7.webp", "img/maze\sym_8.webp", "img/maze\sym_9.webp", "img/maze\tile_a.webp", "img/maze\tile_b.webp", "img/maze\tile_start.webp", "img/hero_wide.webp", "img/hero_phone.webp", "img/logo.webp", "sfx\ui_card.wav", "sfx\ui_close.wav", "sfx\ui_hover.wav", "sfx\ui_no.wav", "sfx\ui_ok.wav", "sfx\ui_open.wav", "sfx\ui_select.wav", "sfx\ui_start.wav", "sfx\ui_tap.wav", "sfx\ui_toggle_off.wav", "sfx\ui_toggle_on.wav", "img/ui/options.webp", "img/ui/home.webp", "img/ui/fs.webp", "img/ui/snd_on.webp", "img/ui/snd_off.webp", "img/ui/rules.webp", "img/ui/new.webp", "theme.css",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: "no-cache" }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true })));
});
