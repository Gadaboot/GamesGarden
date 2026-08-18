/* ============================================================
   Offline Games Arcade — shared achievements + haptics library
   Include in every game page BEFORE the game's own script:
     <script src="achievements.js"></script>
   API (always guard with `window.GGA &&` so pages work standalone):
     GGA.award('id')       — unlock an achievement (no-op if already earned)
     GGA.haptic('light'|'medium'|'heavy'|'success'|'warning'|'error')
     GGA.earned()          — {id: timestamp, ...}
     GGA.streak()          — current daily play streak (number)
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- achievement definitions ---------------- */
  var DEFS = [
    /* general */
    { id: 'first_game',  game: 'Arcade',        icon: '🎮', name: 'First Play',        desc: 'Play your first game' },
    { id: 'streak_3',    game: 'Arcade',        icon: '🔥', name: 'On a Roll',         desc: 'Play 3 days in a row' },
    { id: 'streak_7',    game: 'Arcade',        icon: '🔥', name: 'One Week Wonder',   desc: 'Play 7 days in a row' },
    { id: 'streak_30',   game: 'Arcade',        icon: '🌟', name: 'Dedicated',         desc: 'Play 30 days in a row' },
    { id: 'all_games',   game: 'Arcade',        icon: '🗺️', name: 'Explorer',          desc: 'Play every game at least once' },
    { id: 'badges_10',   game: 'Arcade',        icon: '🏅', name: 'Collector',         desc: 'Earn 10 achievements' },
    /* per game */
    { id: 'sol_win',     game: 'Solitaire',     icon: '🃏', name: 'Solitaire Champion', desc: 'Win a game of Solitaire' },
    { id: 'sol_fast',    game: 'Solitaire',     icon: '⚡', name: 'Speed Dealer',      desc: 'Win Solitaire in under 5 minutes' },
    { id: 'tower_r1',    game: 'Solitaire Tower', icon: '🏰', name: 'Tower Toppler',   desc: 'Clear a round of Solitaire Tower' },
    { id: 'tower_r3',    game: 'Solitaire Tower', icon: '👑', name: 'Castle Conqueror', desc: 'Clear round 3 of Solitaire Tower' },
    { id: 'scopa_sweep', game: 'Scopa',         icon: '🧹', name: 'Scopa!',            desc: 'Sweep the table in Scopa' },
    { id: 'scopa_win',   game: 'Scopa',         icon: '🇮🇹', name: 'Maestro',          desc: 'Win a game of Scopa' },
    { id: 'chess_promote', game: 'Chess',       icon: '♛',  name: 'Promotion',         desc: 'Promote a pawn in Chess' },
    { id: 'chess_win_cpu', game: 'Chess',       icon: '♚',  name: 'Grandmaster',       desc: 'Beat the computer at Chess' },
    { id: 'check_king',  game: 'Checkers',      icon: '⛃',  name: 'Crowned',           desc: 'Crown a king in Checkers' },
    { id: 'check_win_cpu', game: 'Checkers',    icon: '🏆', name: 'Kingmaker',         desc: 'Beat the computer at Checkers' },
    { id: 'ludo_bump',   game: 'Ludo',          icon: '💥', name: 'Bumper',            desc: 'Bump an opponent in Ludo' },
    { id: 'ludo_win',    game: 'Ludo',          icon: '🎲', name: 'Home Run',          desc: 'Win a game of Ludo' },
    { id: 'sea_win',     game: 'Sea Battle',    icon: '⚓', name: 'Admiral',           desc: 'Win Sea Battle' },
    { id: 'sea_perfect', game: 'Sea Battle',    icon: '🚢', name: 'Untouchable',       desc: 'Win Sea Battle with your whole fleet afloat' },
    { id: 'dice_yahtzee', game: 'Five Dice',    icon: '🎲', name: 'Five of a Kind!',   desc: 'Roll five of a kind in Five Dice' },
    { id: 'dice_250',    game: 'Five Dice',     icon: '📈', name: 'High Roller',       desc: 'Score 250 or more in Five Dice' },
    { id: 'merge_2048',  game: '2048',          icon: '🔢', name: '2048!',             desc: 'Make the 2048 tile' },
    { id: 'merge_8192',  game: '2048',          icon: '🚀', name: 'Beyond',            desc: 'Make the 8192 tile' },
    { id: 'word_win',    game: 'Word Guess',    icon: '📗', name: 'Wordsmith',         desc: 'Solve a Word Guess puzzle' },
    { id: 'word_two',    game: 'Word Guess',    icon: '🧠', name: 'Mind Reader',       desc: 'Solve Word Guess in 2 guesses or fewer' },
    { id: 'frog_home',   game: 'Frog Jump',     icon: '🐸', name: 'Full House',        desc: 'Fill all five homes in Frog Jump' },
    { id: 'frog_l3',     game: 'Frog Jump',     icon: '🛣️', name: 'Road Warrior',      desc: 'Reach level 3 in Frog Jump' },
    { id: 'ci_w3',       game: 'Cat Invaders',  icon: '🐱', name: 'Cat Herder',        desc: 'Clear wave 3 in Cat Invaders' },
    { id: 'ci_w10',      game: 'Cat Invaders',  icon: '😼', name: 'Feline Fury',       desc: 'Clear wave 10 in Cat Invaders' },
    { id: 'cci_w3',      game: 'Cartoon Cat Invaders', icon: '😺', name: 'Toon Tamer', desc: 'Clear wave 3 in Cartoon Cat Invaders' },
    { id: 'cci_w10',     game: 'Cartoon Cat Invaders', icon: '🙀', name: 'Cartoon Chaos', desc: 'Clear wave 10 in Cartoon Cat Invaders' },
    { id: 'bub_3star',   game: 'Bubble Shooter', icon: '⭐', name: 'Sharpshooter',     desc: 'Earn 3 stars on a Bubble Shooter level' },
    { id: 'bub_l10',     game: 'Bubble Shooter', icon: '🫧', name: 'Pop Master',       desc: 'Complete level 10 in Bubble Shooter' },
    { id: 'octo_badge',  game: 'Octo Trivia',   icon: '🔶', name: 'Badge of Honour',   desc: 'Fill your badge in Octo Trivia' },
    { id: 'octo_win',    game: 'Octo Trivia',   icon: '🧠', name: 'Trivia Titan',      desc: 'Win a game of Octo Trivia' },
    { id: 'pf_10',       game: 'Flag Painter',  icon: '🎨', name: 'Vexillologist',     desc: 'Paint 10 flags' },
    { id: 'pf_25',       game: 'Flag Painter',  icon: '🌍', name: 'World Painter',     desc: 'Paint 25 flags' },
    { id: 'ana_wheel',   game: 'Anagram-Crossword', icon: '🎡', name: 'Wheel Wizard',  desc: 'Complete a wheel level' },
    { id: 'ana_cross',   game: 'Anagram-Crossword', icon: '✏️', name: 'Puzzle Pro',    desc: 'Complete a crossword puzzle' },
    { id: 'duo_win',     game: 'Una Due',       icon: '🎴', name: 'Duo Dominator',     desc: 'Win a game of Una Due' }
  ];

  var GAME_PAGES = [
    'solitaire', 'magic-towers-solitaire', 'scopa', 'chess', 'checkers', 'ludo',
    'battleships', 'yahtzee', '2048-merge-blocks', 'wordle', 'frogger',
    'cat-invaders', 'cartoon-cat-invaders', 'bubbleshooter', 'octo',
    'paint-the-flag', 'anagram-crosswords', 'duo'
  ];

  var A_KEY = 'gg_ach', S_KEY = 'gg_streak', P_KEY = 'gg_played';

  function getJSON(k, fb) {
    try { return JSON.parse(localStorage.getItem(k) || 'null') || fb; } catch (e) { return fb; }
  }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function defOf(id) {
    for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) return DEFS[i];
    return null;
  }

  function haptic(type) {
    try { window.webkit.messageHandlers.haptic.postMessage(type || 'light'); } catch (e) {}
  }

  /* ---------------- unlock toast ---------------- */
  var queue = [], showing = false;
  function toast(def) {
    queue.push(def);
    if (!showing) next();
  }
  function next() {
    var def = queue.shift();
    if (!def) { showing = false; return; }
    showing = true;
    var el = document.createElement('div');
    el.setAttribute('style',
      'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 12px);left:50%;' +
      'transform:translateX(-50%) translateY(-120%);z-index:99999;' +
      'display:flex;align-items:center;gap:10px;max-width:88vw;' +
      'background:linear-gradient(180deg,#2a4a35,#16301f);border:2px solid #ffd24a;' +
      'border-radius:14px;padding:10px 16px;box-shadow:0 10px 30px rgba(0,0,0,.5);' +
      'font-family:-apple-system,\'Segoe UI\',Roboto,sans-serif;color:#f5efdd;' +
      'transition:transform .35s cubic-bezier(.2,1.2,.4,1);pointer-events:none;');
    el.innerHTML =
      '<span style="font-size:26px;line-height:1;">' + def.icon + '</span>' +
      '<span style="text-align:left;">' +
      '<span style="display:block;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ffd24a;">ACHIEVEMENT UNLOCKED</span>' +
      '<span style="display:block;font-size:14px;font-weight:800;">' + def.name + '</span>' +
      '</span>';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.style.transform = 'translateX(-50%) translateY(0)'; });
    });
    setTimeout(function () {
      el.style.transform = 'translateX(-50%) translateY(-120%)';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        next();
      }, 400);
    }, 2600);
  }

  /* ---------------- core ---------------- */
  function earnedMap() { return getJSON(A_KEY, {}); }
  function has(id) { return !!earnedMap()[id]; }

  function award(id) {
    var def = defOf(id);
    if (!def) return;
    var m = earnedMap();
    if (m[id]) return;
    m[id] = Date.now();
    setJSON(A_KEY, m);
    toast(def);
    haptic('success');
    /* meta: collector */
    var count = 0;
    for (var k in m) if (m.hasOwnProperty(k)) count++;
    if (count >= 10 && !m['badges_10']) award('badges_10');
  }

  /* ---------------- daily streak + played tracking ---------------- */
  function dayStr(d) {
    return d.getFullYear() + '-' +
      ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
      ('0' + d.getDate()).slice(-2);
  }
  function touch() {
    var today = dayStr(new Date());
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yesterday = dayStr(y);
    var s = getJSON(S_KEY, { last: '', n: 0 });
    if (s.last !== today) {
      s.n = (s.last === yesterday) ? s.n + 1 : 1;
      s.last = today;
      setJSON(S_KEY, s);
    }
    award('first_game');
    if (s.n >= 3) award('streak_3');
    if (s.n >= 7) award('streak_7');
    if (s.n >= 30) award('streak_30');
  }
  function trackPlayed() {
    var path = (location.pathname.split('/').pop() || '').replace('.html', '');
    if (GAME_PAGES.indexOf(path) === -1) return false;
    var p = getJSON(P_KEY, {});
    if (!p[path]) { p[path] = 1; setJSON(P_KEY, p); }
    var n = 0;
    for (var i = 0; i < GAME_PAGES.length; i++) if (p[GAME_PAGES[i]]) n++;
    if (n >= GAME_PAGES.length) award('all_games');
    return true;
  }

  /* ---------------- public API ---------------- */
  window.GGA = {
    defs: DEFS,
    earned: earnedMap,
    has: has,
    award: award,
    haptic: haptic,
    streak: function () { return getJSON(S_KEY, { n: 0 }).n; },
    playedCount: function () {
      var p = getJSON(P_KEY, {}), n = 0;
      for (var i = 0; i < GAME_PAGES.length; i++) if (p[GAME_PAGES[i]]) n++;
      return n;
    },
    totalGames: GAME_PAGES.length
  };

  /* auto-run when loaded on a game page */
  if (trackPlayed()) touch();
})();
