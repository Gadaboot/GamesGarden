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
    { id: 'played_5',    game: 'Arcade',        icon: '🕹️', name: 'Getting Around',    desc: 'Play 5 different games' },
    { id: 'played_10',   game: 'Arcade',        icon: '🗺️', name: 'Explorer',          desc: 'Play 10 different games' },
    { id: 'played_15',   game: 'Arcade',        icon: '🧭', name: 'Wanderer',          desc: 'Play 15 different games' },
    { id: 'all_games',   game: 'Arcade',        icon: '🏰', name: 'The Full Set',      desc: 'Play every game at least once' },
    { id: 'badges_10',   game: 'Arcade',        icon: '🏅', name: 'Collector',         desc: 'Earn 10 achievements' },
    { id: 'badges_25',   game: 'Arcade',        icon: '🎖️', name: 'Cabinet Filler',    desc: 'Earn 25 achievements' },
    { id: 'badges_40',   game: 'Arcade',        icon: '👑', name: 'Champion',          desc: 'Earn 40 achievements' },
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
    { id: 'ludo_bump',   game: 'Ludo',          icon: '💥', name: 'Bumper',            desc: 'Send an opponent home in Ludo' },
    { id: 'ludo_win',    game: 'Ludo',          icon: '🎲', name: 'Home Run',          desc: 'Win a game of Ludo' },
    { id: 'sea_win',     game: 'Sea Battle',    icon: '⚓', name: 'Admiral',           desc: 'Win Sea Battle' },
    { id: 'sea_perfect', game: 'Sea Battle',    icon: '🚢', name: 'Untouchable',       desc: 'Win Sea Battle with your whole fleet afloat' },
    { id: 'dice_five',   game: 'Five Dice',     icon: '🎲', name: 'Five of a Kind!',   desc: 'Roll five of a kind in Five Dice' },
    { id: 'dice_250',    game: 'Five Dice',     icon: '📈', name: 'High Roller',       desc: 'Score 250 or more in Five Dice' },
    { id: 'merge_2048',  game: '2048',          icon: '🔢', name: '2048!',             desc: 'Make the 2048 tile' },
    { id: 'merge_8192',  game: '2048',          icon: '🚀', name: 'Beyond',            desc: 'Make the 8192 tile' },
    { id: 'word_win',    game: 'Word Guess',    icon: '📗', name: 'Wordsmith',         desc: 'Solve a Word Guess puzzle' },
    { id: 'word_two',    game: 'Word Guess',    icon: '🧠', name: 'Mind Reader',       desc: 'Solve Word Guess in 2 guesses or fewer' },
    { id: 'frog_home',   game: 'Frog Jump',     icon: '🐸', name: 'Full House',        desc: 'Fill all five homes in Frog Jump' },
    { id: 'frog_l3',     game: 'Frog Jump',     icon: '🛣️', name: 'Road Warrior',      desc: 'Reach level 3 in Frog Jump' },
    { id: 'cp_w3',       game: 'Cat Poopers',   icon: '🐱', name: 'Cat Herder',        desc: 'Clear wave 3 in Cat Poopers' },
    { id: 'cp_w10',      game: 'Cat Poopers',   icon: '😼', name: 'Feline Fury',       desc: 'Clear wave 10 in Cat Poopers' },
    { id: 'cp_boss',     game: 'Cat Poopers',   icon: '👑', name: 'Boss Dropped',      desc: 'Knock down the boss fluff' },
    { id: 'bub_3star',   game: 'Bubble Shooter', icon: '⭐', name: 'Sharpshooter',     desc: 'Earn 3 stars on a Bubble Shooter level' },
    { id: 'bub_l10',     game: 'Bubble Shooter', icon: '🫧', name: 'Pop Master',       desc: 'Complete level 10 in Bubble Shooter' },
    { id: 'octo_badge',  game: 'Octo Trivia',   icon: '🔶', name: 'Badge of Honour',   desc: 'Fill your badge in Octo Trivia' },
    { id: 'octo_win',    game: 'Octo Trivia',   icon: '🧠', name: 'Trivia Titan',      desc: 'Win a game of Octo Trivia' },
    { id: 'ana_wheel',   game: 'Anagram-Crossword', icon: '🎡', name: 'Wheel Wizard',  desc: 'Complete a wheel level' },
    { id: 'ana_cross',   game: 'Anagram-Crossword', icon: '✏️', name: 'Puzzle Pro',    desc: 'Complete a crossword puzzle' },
    { id: 'eh_win',      game: 'Empty Hand',    icon: '🎴', name: 'Clean Sweep',       desc: 'Win a game of Empty Hand' },
    { id: 'eh_big',      game: 'Empty Hand',    icon: '👥', name: 'Table Boss',        desc: 'Win with 4 or more players' },
    { id: 'sl_round',    game: 'Spinny Letters', icon: '🎡', name: 'Round Winner',     desc: 'Win a round of Spinny Letters' },
    { id: 'sl_game',     game: 'Spinny Letters', icon: '🏆', name: 'Big Spinner',      desc: 'Win a game of Spinny Letters' },
    { id: 'sl_solve',    game: 'Spinny Letters', icon: '🔤', name: 'Straight Solve',   desc: 'Solve the puzzle outright' },
    { id: 'ofs_cross',   game: 'One False Step', icon: '🏁', name: 'Safe Passage',     desc: 'Reach the exit' },
    { id: 'ofs_clean',   game: 'One False Step', icon: '🪶', name: 'Not a Slip',       desc: 'Cross without a single slip' },
    { id: 'ofs_bank',    game: 'One False Step', icon: '💰', name: 'Cash Out',         desc: 'Take home £5,000 or more' },
    { id: 'wp_win',      game: 'Word Points',   icon: '🔠', name: 'Word Winner',       desc: 'Beat the computer at Word Points' },
    { id: 'wp_bingo',    game: 'Word Points',   icon: '💥', name: 'All Seven',         desc: 'Play all seven tiles in one go' },
    { id: 'wp_boards',   game: 'Word Points',   icon: '🧩', name: 'Board Tourist',     desc: 'Play a game on every board shape' },
    { id: 'np_null',     game: 'Null Points',   icon: '🎯', name: 'Found a Null',      desc: 'Land an answer that scores zero' },
    { id: 'np_win',      game: 'Null Points',   icon: '🥇', name: 'Match Winner',      desc: 'Win a match of Null Points' },
    { id: 'np_pot',      game: 'Null Points',   icon: '💷', name: 'Pot Winner',        desc: 'Win the prize pot in the final' },
    { id: 'pool_win',    game: 'Pool',          icon: '🎱', name: 'Cue Master',        desc: 'Beat the computer at Pool' },
    { id: 'ae_l10',      game: 'Arrow Exit',    icon: '➡️', name: 'Finding a Way',     desc: 'Reach level 10 in Arrow Exit' },
    { id: 'ae_l50',      game: 'Arrow Exit',    icon: '🧠', name: 'Untangler',         desc: 'Reach level 50 in Arrow Exit' },
    { id: 'aes_l10',     game: 'Arrow Exit Shapes', icon: '🔷', name: 'Shape Shifter', desc: 'Reach level 10 in Arrow Exit Shapes' },
    { id: 'aes_l50',     game: 'Arrow Exit Shapes', icon: '🏵️', name: 'Shape Master',  desc: 'Reach level 50 in Arrow Exit Shapes' },
    { id: 'sf_line',     game: 'Snug Fit',      icon: '🧱', name: 'First Clear',       desc: 'Clear your first line in Snug Fit' },
    { id: 'sf_triple',   game: 'Snug Fit',      icon: '💥', name: 'Triple Threat',     desc: 'Clear three lines with one shape' },
    { id: 'sf_streak5',  game: 'Snug Fit',      icon: '🔥', name: 'On the Bounce',     desc: 'Clear on five drops in a row' },
    { id: 'sf_sweep',    game: 'Snug Fit',      icon: '✨', name: 'Clean Sweep',       desc: 'Empty the whole board in Snug Fit' },
    { id: 'sf_1500',     game: 'Snug Fit',      icon: '📈', name: 'Snug as Anything', desc: 'Score 1,500 in Snug Fit' },
    { id: 'sf_5000',     game: 'Snug Fit',      icon: '🏆', name: 'Master Fitter',     desc: 'Score 5,000 in Snug Fit' },
    { id: 'sf_nine',     game: 'Snug Fit',      icon: '🔹', name: 'Nine Lives',        desc: 'Score 2,500 on the Nine board' },
    { id: 'mz_first',    game: 'Maze Escape',   icon: '🏁', name: 'Way Out',           desc: 'Escape your first maze' },
    { id: 'mz_l5',       game: 'Maze Escape',   icon: '🌱', name: 'Getting Rolling',   desc: 'Clear level 5' },
    { id: 'mz_l10',      game: 'Maze Escape',   icon: '🔥', name: 'Ten Down',          desc: 'Clear level 10' },
    { id: 'mz_l25',      game: 'Maze Escape',   icon: '💎', name: 'Halfway Hero',      desc: 'Clear level 25' },
    { id: 'mz_l50',      game: 'Maze Escape',   icon: '👑', name: 'Maze Master',       desc: 'Clear level 50' },
    { id: 'mz_all',      game: 'Maze Escape',   icon: '🌟', name: 'Escape Artist',     desc: 'Clear all 60 mazes' },
    { id: 'mz_gifts10',  game: 'Maze Escape',   icon: '🎁', name: 'Unwrapped',         desc: 'Collect 10 gifts' },
    { id: 'mz_gifts50',  game: 'Maze Escape',   icon: '🎀', name: 'Gift Hunter',       desc: 'Collect 50 gifts' },
    { id: 'mz_gifts150', game: 'Maze Escape',   icon: '🛍️', name: 'Hoarder',          desc: 'Collect 150 gifts' },
    { id: 'mz_secret',   game: 'Maze Escape',   icon: '🚪', name: 'Secret Knock',      desc: 'Find 5 secret doors' },
    { id: 'mz_trap',     game: 'Maze Escape',   icon: '🕳️', name: 'Back to Square 1', desc: 'Fall through 3 trap doors' },
    { id: 'mz_speed',    game: 'Maze Escape',   icon: '⚡', name: 'Quicksilver',       desc: 'Escape a maze in under 15 seconds' },
    { id: 'mz_flawless', game: 'Maze Escape',   icon: '✨', name: 'Spotless Run',      desc: 'Clear a level taking every gift, no traps' },
    { id: 'mz_themes',   game: 'Maze Escape',   icon: '🎨', name: 'Interior Designer', desc: 'Play all three boards' },
    { id: 'mz_score',    game: 'Maze Escape',   icon: '💰', name: 'Ten Grand',         desc: 'Reach 10,000 points in Maze Escape' },
    { id: 'mz_marathon', game: 'Maze Escape',   icon: '🏃', name: 'Marathon',          desc: 'Clear 10 mazes in one sitting' },
    { id: 'mz_shapes',   game: 'Maze Escape',   icon: '🧩', name: 'Shape Shifter',     desc: 'Clear a maze of every shape' },
    { id: 'sud_win',     game: 'Sudoku',        icon: '🔢', name: 'Grid Filled',       desc: 'Solve a Sudoku' },
    { id: 'sud_clean',   game: 'Sudoku',        icon: '🧼', name: 'Spotless',          desc: 'Solve one with no slips and no hints' },
    { id: 'sud_hard',    game: 'Sudoku',        icon: '🧠', name: 'Deep Thinker',      desc: 'Solve a Hard or Expert grid' },
    { id: 'sud_expert',  game: 'Sudoku',        icon: '👑', name: 'Sudoku Master',     desc: 'Solve an Expert grid' },
    { id: 'sud_fast',    game: 'Sudoku',        icon: '⚡', name: 'Quick Pencil',      desc: 'Solve above Easy in under 5 minutes' },
    { id: 'sud_alldiff', game: 'Sudoku',        icon: '🎯', name: 'Full House',        desc: 'Solve a grid at every level' },
    { id: 'ws_first',    game: 'Water Sort',    icon: '🧪', name: 'First Pour',        desc: 'Sort your first level' },
    { id: 'ws_l10',      game: 'Water Sort',    icon: '🌈', name: 'Ten Tidy',          desc: 'Reach level 10' },
    { id: 'ws_l25',      game: 'Water Sort',    icon: '🔬', name: 'Colour Chemist',    desc: 'Reach level 25' },
    { id: 'ws_l50',      game: 'Water Sort',    icon: '👑', name: 'Master Mixer',      desc: 'Reach level 50' },
    { id: 'ws_noextra',  game: 'Water Sort',    icon: '💪', name: 'No Help Needed',    desc: 'Sort a level without an extra tube' },
    { id: 'ws_tidy',     game: 'Water Sort',    icon: '✨', name: 'Neat Work',        desc: 'Sort a level in very few moves' },
    { id: 'mj_win',      game: 'Mahjong',       icon: '🀄', name: 'Board Cleared',     desc: 'Clear a Mahjong board' },
    { id: 'mj_noshuffle',game: 'Mahjong',       icon: '🧿', name: 'No Shuffling',      desc: 'Clear a board without shuffling' },
    { id: 'mj_tower',    game: 'Mahjong',       icon: '🏯', name: 'Tower Cleared',     desc: 'Clear the full 144-tile Tower' },
    { id: 'mj_fast',     game: 'Mahjong',       icon: '⚡', name: 'Swift Hands',       desc: 'Clear the Tower in under 10 minutes' },
    { id: 'mj_alllayouts',game:'Mahjong',       icon: '🏵️', name: 'Every Board',      desc: 'Clear all three Mahjong boards' },
    { id: 'no_first',    game: 'Picture Logic', icon: '🖼️', name: 'Picture Revealed',  desc: 'Finish your first picture' },
    { id: 'no_clean',    game: 'Picture Logic', icon: '🧼', name: 'Not a Slip',        desc: 'Finish a picture with no mistakes' },
    { id: 'no_big',      game: 'Picture Logic', icon: '🖼️', name: 'Big Canvas',        desc: 'Finish a 15x15 picture' },
    { id: 'no_10',       game: 'Picture Logic', icon: '🎨', name: 'Gallery Started',   desc: 'Finish 10 pictures' },
    { id: 'no_30',       game: 'Picture Logic', icon: '🖼️', name: 'Gallery Owner',     desc: 'Finish 30 pictures' },
    { id: 'no_pack',     game: 'Picture Logic', icon: '👑', name: 'Full Collection',   desc: 'Finish every picture in one set' },
    { id: 'sp_win',      game: 'Spider',        icon: '🕷️', name: 'All Eight Home',   desc: 'Win a game of Spider' },
    { id: 'sp_two',      game: 'Spider',        icon: '♠️', name: 'Two Suits Down',    desc: 'Win a two-suit game' },
    { id: 'sp_four',     game: 'Spider',        icon: '👑', name: 'Four Suits Down',   desc: 'Win a four-suit game' },
    { id: 'sp_noundo',   game: 'Spider',        icon: '🧿', name: 'No Second Thoughts',desc: 'Win without using undo' },
    { id: 'sp_allsuits', game: 'Spider',        icon: '🏅', name: 'Every Difficulty',  desc: 'Win at one, two and four suits' },
    { id: 'fc_win',      game: 'FreeCell',      icon: '🃏', name: 'All Home',          desc: 'Win a game of FreeCell' },
    { id: 'fc_noundo',   game: 'FreeCell',      icon: '🧿', name: 'Straight Through',  desc: 'Win without using undo' },
    { id: 'fc_tidy',     game: 'FreeCell',      icon: '✨', name: 'Economical',       desc: 'Win in 70 moves or fewer' },
    { id: 'fc_5',        game: 'FreeCell',      icon: '📈', name: 'Five Deals',        desc: 'Win five different deals' },
    { id: 'fc_25',       game: 'FreeCell',      icon: '👑', name: 'Twenty-Five Deals', desc: 'Win twenty-five different deals' },
    { id: 'ms_win',      game: 'Mine Hunt',     icon: '💣', name: 'All Clear',         desc: 'Clear a board without hitting a mine' },
    { id: 'ms_med',      game: 'Mine Hunt',     icon: '🎯', name: 'Tricky Cleared',    desc: 'Clear the 12 × 15 board' },
    { id: 'ms_hard',     game: 'Mine Hunt',     icon: '🧨', name: 'Fiendish Cleared',  desc: 'Clear the 14 × 18 board' },
    { id: 'ms_fast',     game: 'Mine Hunt',     icon: '⏱️', name: 'Steady Hands',      desc: 'Clear Fiendish in under five minutes' },
    { id: 'ms_allsizes', game: 'Mine Hunt',     icon: '🏵️', name: 'Every Board',       desc: 'Clear Gentle, Tricky and Fiendish' },
    { id: 'ms_10',       game: 'Mine Hunt',     icon: '🔟', name: 'Ten Sweeps',        desc: 'Clear ten boards in total' },
    { id: 'wse_first',   game: 'Word Search',   icon: '🔎', name: 'First Find',        desc: 'Finish a Word Search puzzle' },
    { id: 'wse_hard',    game: 'Word Search',   icon: '🧠', name: 'Fiendish Finder',   desc: 'Finish a 14 x 14 puzzle' },
    { id: 'wse_clean',   game: 'Word Search',   icon: '✨', name: 'No Help Needed',    desc: 'Finish one without a hint or a reveal' },
    { id: 'wse_fast',    game: 'Word Search',   icon: '⚡', name: 'Eagle Eyed',        desc: 'Finish Tricky or Fiendish in under three minutes' },
    { id: 'wse_10',      game: 'Word Search',   icon: '📚', name: 'Ten Themes',        desc: 'Finish ten puzzles in total' },
    { id: 'wse_alldiff', game: 'Word Search',   icon: '🏵️', name: 'Every Size',        desc: 'Finish Gentle, Tricky and Fiendish' }
  ];

  var GAME_PAGES = [
    'octo', 'five-dice', 'chess', 'checkers', 'solitaire', 'bubbleshooter',
    'word-guess', 'frog-jump', 'anagram-crosswords', '2048-merge-blocks',
    'cat-poopers', 'sea-battle', 'ludo', 'scopa', 'solitaire-tower',
    'empty-hand', 'england-football-coach', 'arrow-exit', 'billiards',
    'arrow-exit-shapes', 'word-points', 'spinny-letters', 'one-false-step',
    'nullpoints', 'snug-fit', 'maze-escape', 'sudoku', 'water-sort', 'mahjong',
    'picture-logic', 'spider', 'freecell', 'mine-hunt', 'word-search'
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
    /* the library may be included in <head>, before body exists */
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () {
        queue.unshift(def); showing = false; next();
      }, { once: true });
      return;
    }
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
    if (count >= 25 && !m['badges_25']) award('badges_25');
    if (count >= 40 && !m['badges_40']) award('badges_40');
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
    if (n >= 5)  award('played_5');
    if (n >= 10) award('played_10');
    if (n >= 15) award('played_15');
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
