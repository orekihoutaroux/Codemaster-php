/*
===============================================================================
CODEMASTER PHP - MODULE LOADER
===============================================================================
index.html is only a shell. This loader:
  1. fetches every page + overlay partial into #app-root
  2. loads the game scripts below in order (classic scripts, so all functions
     stay global for the inline onclick handlers in the partials)
  3. unhides the app once everything is ready

Folders under js/
  data/     game content: heroes, monsters, offline questions
  sprites/  how heroes and monsters are drawn and animated
  core/     shared plumbing used by every screen (state, saving, server
            calls, navigation, sound, startup)
  game/     the dungeon itself: battles, timer, shop
  screens/  one file per screen or overlay (home, account, hero select,
            leaderboard, tutorial, settings)
  admin/    the admin login and dashboard

ORDER MATTERS: a file may only use things defined in files above it when it
first runs. To add a file, put it in the right folder and add it to SCRIPTS.
===============================================================================
*/
(function () {
  var PAGES = [
    'pages/home.html',
    'pages/leaderboard.html',
    'pages/account.html',
    'pages/hero-select.html',
    'pages/study.html',
    'pages/game.html',
    'pages/tutorial.html'
  ];

  var OVERLAYS = [
    'overlays/account-info.html',
    'overlays/shop.html',
    'overlays/settings.html',
    'overlays/admin-login.html',
    'overlays/admin.html',
    'overlays/admin-reset-confirm.html'
  ];

  var SCRIPTS = [
    'js/data/heroes.js',              // the six heroes: stats, colours, special skills
    'js/data/monsters.js',            // monsters, bosses, the floor map and combat balance
    'js/sprites/sprite-engine.js',    // draws heroes and monsters from shapes, with poses
    'js/sprites/hero-sprites.js',     // the look of each hero
    'js/sprites/monster-sprites.js',  // the look of each monster and boss
    'js/data/questions-fallback.js',  // questions used when the server cannot be reached
    'js/core/lesson-format.js',       // turns lesson text into the Study Materials page
    'js/core/state.js',               // the variables that make up a run (HP, score, floor ...)
    'js/core/persistence.js',         // saving and loading a player's progress
    'js/core/api.js',                 // every call to the server (/api/...)
    'js/core/navigation.js',          // showScreen(), floor themes, account form state, display settings
    'js/core/audio.js',               // sound effects
    'js/game/timer.js',               // the question countdown
    'js/screens/home-door.js',        // home page: dungeon door and star field
    'js/screens/hero-select.js',      // hero select cards
    'js/core/music.js',               // background music
    'js/screens/account.js',          // create account, log in, enter the game
    'js/game/battle.js',              // questions, attacks, damage, floors and bosses
    'js/game/battle-background.js',   // the pixel-art place behind each fight (one per floor)
    'js/game/battle-fx.js',           // pixel-art hero attacks and special skills
    'js/game/shop.js',                // opening and closing the shop
    'js/admin/admin-login.js',        // admin sign-in and the hidden logo shortcut
    'js/screens/settings.js',         // settings overlay and exit to title
    'js/admin/admin-panel.js',        // admin dashboard: questions, categories, users, admins
    'js/core/feedback.js',            // toasts, death screen, shop purchases, helpers
    'js/core/events.js',              // keyboard shortcuts and page lifecycle
    'js/screens/leaderboard.js',      // leaderboard screen
    'js/core/startup.js',             // runs once everything above has loaded
    'js/core/password-visibility.js', // eye buttons on password fields
    'js/screens/tutorial.js',         // How to Play
    'js/screens/home-background.js',  // home page: animated night-sky background
    'js/screens/home.js',             // home page: live battle, numbers, top coders
    'js/screens/study.js',            // Study Materials: loads and shows the lessons
    'js/admin/admin-lessons.js'       // admin dashboard: STUDY MATERIALS tab
  ];

  var root = document.getElementById('app-root');

  function fetchText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error(url + ' (' + res.status + ')');
      return res.text();
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(script);
    });
  }

  function showError(err) {
    console.error('App bootstrap failed:', err);
    document.body.classList.remove('app-loading');
    if (root) {
      root.innerHTML =
        '<div class="app-boot-error">' +
        '<strong>Failed to load the game modules.</strong>' +
        '<small>' + (err && err.message ? err.message : err) + '</small>' +
        '<small>Run the app through the Express server (npm start), not by opening index.html directly.</small>' +
        '</div>';
    }
  }

  async function boot() {
    try {
      var urls = PAGES.concat(OVERLAYS);
      var parts = await Promise.all(urls.map(fetchText));
      root.innerHTML = parts.join('\n');

      for (var i = 0; i < SCRIPTS.length; i += 1) {
        await loadScript(SCRIPTS[i]);
      }

      document.body.classList.remove('app-loading');
    } catch (err) {
      showError(err);
    }
  }

  boot();
})();
