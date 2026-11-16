/*
===============================================================================
CODEMASTER PHP - MODULE LOADER
===============================================================================
index.html is only a shell. This loader:
  1. fetches every page + overlay partial into #app-root
  2. loads the game scripts below in order (classic scripts, so all functions
     stay global for the inline onclick handlers in the partials)
  3. unhides the app once everything is ready

APP.JS MAP (one file each, loaded in this order)
  01  Drawing helpers and character data
  02  Monsters, dungeon encounters, and bosses
  02a Sprite engine (draws heroes and monsters from shapes, with poses)
  02b Hero sprites
  02c Monster and boss sprites
  03  Question data and offline fallback
  04  Runtime game state
  05  Player persistence and state synchronization
  06  Question, battle, shop, and admin API requests
  07  Screen navigation, account panel, themes, and display preferences
  08  Music and sound effects
  09  Question timer
  10  Title animation and character selection
  11  Account access and game entry
  12  Battle, questionnaire, and progression
  13  Shop controls
  14  Admin access
  15  Settings
  16  Admin question and user management
  17  Visual feedback, reset, and utility functions
  18  Keyboard, lifecycle, and input events
  19  Leaderboard
  20  Application startup
===============================================================================
*/
(function () {
  var PAGES = [
    'pages/title.html',
    'pages/leaderboard.html',
    'pages/add-user.html',
    'pages/select.html',
    'pages/learn.html',
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
    'js/01-drawing-characters.js',
    'js/02-monsters-bosses.js',
    'js/02a-sprite-engine.js',
    'js/02b-hero-sprites.js',
    'js/02c-monster-sprites.js',
    'js/03-question-data.js',
    'js/04-runtime-state.js',
    'js/05-persistence.js',
    'js/06-api-requests.js',
    'js/07-navigation-display.js',
    'js/08-audio.js',
    'js/09-question-timer.js',
    'js/10-title-character-select.js',
    'js/11-account-entry.js',
    'js/12-battle-progression.js',
    'js/13-shop-controls.js',
    'js/14-admin-access.js',
    'js/15-settings.js',
    'js/16-admin-management.js',
    'js/17-feedback-utilities.js',
    'js/18-events.js',
    'js/19-leaderboard.js',
    'js/20-startup.js',
    'js/21-password-visibility.js',
    'js/22-tutorial.js',
    'js/23-home.js'
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
