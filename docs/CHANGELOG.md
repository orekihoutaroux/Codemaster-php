# CodeMaster PHP — change history

Newest changes are at the bottom. For how the project is organised now, see
the [README](../README.md).

## Moving from the browser to MongoDB (first version)


- **Player save state** — score, HP, gold, floor, buffs, etc. — is now stored
  in a `players` collection, keyed by the username you type on the start
  screen. Since it's keyed by name instead of browser storage, the same
  username can resume its run from a different browser or device.
- **Question bank** lives in a `questions` collection in MongoDB. The server
  stores the 25 starter questions there the first time it finds the collection
  empty, so there is nothing to run by hand. Everything the admin editor saves
  — a new question or a change to a starter one — is written to that same
  collection and is used by the quiz immediately.
- **Leaderboard** lives in a `leaderboard` collection, seeded with your
  original 10 sample rows plus one `ExampleUser` row. Real runs now get added
  to it automatically when a player dies (see `submitLeaderboardScore()` in
  `app.js`).
- **Admin "Manage Users" panel** — open the admin dashboard (click the logo 5x,
  login `admin`/`admin123`), and there's now a second tab alongside the
  question editor. It lists every saved player, lets you edit their stats
  (score, level, floor, gold, HP, potions, kills), reset their run to
  defaults, or delete their save entirely. Seeded with one `ExampleUser` save
  so the panel has something to show right after `npm run seed`.
- Everything else (game logic, scoring math, sprites, UI) is untouched — only
  the persistence layer changed.


### Notes from that version (some are out of date: real player passwords and
### server-side admin accounts were added later)


- **No auth.** A "player" is just whatever username someone types — there's no
  password, so anyone typing the same name as you could see/overwrite your
  save. That matches the original app's security level (none), but if this is
  going somewhere with real users, you'll want to add real accounts before
  relying on it.
- **The admin login** (`admin` / `admin123`, click the logo 5x) is still a
  client-side-only check in `app.js` — it was that way before too. The
  `/api/admin/*` routes themselves aren't protected server-side. If this
  matters for your use case, say the word and I'll add real auth to those
  routes.
- I couldn't run `npm install` or actually connect to a live MongoDB from this
  sandbox (no network access here), so I've syntax-checked every file
  (`node --check`) but haven't done an end-to-end run. Try the steps above and
  paste me any error you hit — I'll debug it from there.
- One pre-existing bug I fixed along the way: the original `loadState()`
  function was defined but never called anywhere, so progress never actually
  persisted across reloads even though `saveState()` was being called
  constantly. It's wired in now (via `startGame()`), so saves genuinely resume.


## Changelog — bug-fix and UI pass

**Bugs fixed**
- Code questions showed raw `"color:#ff6b6b">` text: the syntax highlighter was
  re-matching its own markup. It is now a single-pass tokenizer.
- Question text, choices and explanations are escaped on output. A choice such
  as `<!-- comment -->` used to render as an empty button, explanations showed
  literal `&lt;?php`, and admin-entered HTML was injected into the page.
- Keyboard shortcuts (A–D, 1–4, Enter, Space) fired outside the battle: typing a
  username or the admin password after leaving a run answered the hidden
  question and cost HP. They are now ignored in form fields, on other screens,
  under overlays and on the death screen. Esc closes the shop, settings and
  admin login.
- The question timer kept running after EXIT TO TITLE and could time out a
  hidden question. It stops when you leave the battle.
- A player with 0 potions got 2 again on the next login.
- There was no way to drink a potion (the button was missing). POTION is back
  beside SHOP, and it will not waste a potion at full HP.
- Monster kill gold now matches the "+Ng" shown in the toast (it always gave 5).
- Settings → CANCEL now undoes the volume/font preview.
- RESTART GAME records the run on the leaderboard, like a death does.
- Leaderboard shows each player's best run once instead of one row per death;
  the "Boss Bonus +25pts" note was wrong (bosses give gold) and is gone.
- Admin: the Level field never took effect (level is derived from score), so it
  is now read-only and follows the score; number fields are clamped.
- Hero sprites with tall hats (Wizard, Knight plume) were clipped.
- Server: saving a player requires a username and a state object; unknown
  `/api` routes and malformed JSON now return JSON errors.

**UI**
- New `css/21-layout-polish.css` (loaded last): hero select, leaderboard and
  the battle side panel no longer clip on laptop-height screens; long code
  questions scroll and the explanation scrolls into view; consistent form
  controls and focus rings; tidier settings, leaderboard and title buttons.
- Hero select has a BACK button. Tablets and phones get a stacked battle layout.

**Left as it was**
- Reloading the page during a run still archives that run and starts a fresh
  one (`archiveAndResetActivePlayerProgress`). EXIT TO TITLE keeps progress.
- The admin login is still a client-side check and the `/api/admin/*` and
  player-edit routes are not protected on the server.

## Changelog — questions stored in MongoDB

The question bank was only half in the database. `questions` was filled by
`npm run seed`, which is easy to miss: with an empty collection the game fell
back silently to the copy hardcoded in `public/js/03-question-data.js`, so the
quiz looked fine while MongoDB stayed empty. Changes to a starter question also
went to a second collection, `question_edits`, instead of to the question.

What changed:

- **The server seeds the bank itself.** On every boot it stores any starter
  question that is missing from `questions` and prints the count:
  `[db] Question bank: 25 question(s) in the "questions" collection.`
  Questions already stored are never overwritten.
- **Every save goes to `questions`.** Adding a question and editing a starter
  one both write to that one collection, so what the quiz asks is exactly what
  is in the database. Each record carries `source` (`seed` or `admin`),
  `isCustom`, `edited`, `createdAt` and `updatedAt`.
- **RESET BUILT-IN EDITS** rewrites the starter questions from
  `questions_seed.json` and leaves added questions alone — same behaviour as
  before, now without a second collection.
- **Old `question_edits` records are migrated** into `questions` on startup and
  the old collection is emptied, so an existing database keeps its edits.
- **The offline copy is now visible.** If the database cannot be reached, the
  game still plays from the built-in questions but says so with a toast, sets
  `data-question-storage="offline"` on `<body>`, and the admin editor warns
  that nothing can be saved instead of looking like it works.
- The question editor's header shows how many questions are stored in MongoDB,
  and the list marks each one `CUSTOM` or `EDITED`.

Checking it yourself: in `mongosh`, `use codemaster_php` then
`db.questions.countDocuments()` and
`db.questions.find({source:"admin"})`.

Not done: there is still no way to delete a question from the admin panel, and
the `/api/admin/*` routes remain unprotected on the server.

## Changelog — admin accounts

- **MANAGE ADMINS tab** next to MANAGE USERS: lists every admin (who added
  them, last login), **ADD ADMIN** creates one (username + password, typed
  twice), and **REMOVE** deletes another admin. You cannot remove yourself or
  the last admin. LOG OUT ends your session.
- **Logins are checked by the server.** Admins are stored in the `admins`
  collection with scrypt-hashed passwords; a login creates a 12-hour session in
  `admin_sessions` (only a hash of the token is stored). The old hardcoded
  `admin` / `admin123` check in the browser is gone.
- **Admin routes are protected.** `/api/admin/*` (question edits, the user
  list, admin management) and `DELETE /api/players/:username` now answer 401
  without a valid session. The routes the game itself uses are unchanged.
- **First admin:** created on first boot from `ADMIN_USERNAME` /
  `ADMIN_PASSWORD`, or `admin` / `admin123` if those are not set. Replace it.
- Removing an admin logs them out immediately; an expired session sends you
  back to the login.

## Changelog — PHP course and bigger question bank

- **Study Materials** is now a 13-lesson PHP course: Intro, Variables & Types,
  Operators, Strings, Arrays, Control Flow, Functions, Classes & Objects,
  Inheritance/Interfaces/Traits, Errors & Exceptions, PHP on the Web (forms,
  sessions, cookies, XSS, password hashing), Databases with PDO, and Modern
  PHP 8. Every example was run with PHP 8.3 and its OUTPUT box shows the real
  result. Lessons have PREV/NEXT buttons; on phones the tab row scrolls sideways.
- **100 new questions** (ids 1001–1100), bringing the bank to 125. New
  categories: operators, errors, web, database. Every "What does this output?"
  question was executed with PHP 8.3 to confirm its answer.
- New seed questions are added to MongoDB automatically on the next server
  start. Questions you edited or added in the admin panel are left untouched.

## Changelog — new heroes, monsters and attack animations

- **All 26 sprites were redrawn** (6 heroes, 15 monsters, 5 bosses). They are
  no longer 8x10 blocks: each one is drawn from shapes into a 64x64 pixel
  canvas with outlines and shading, and shown at exactly 3x (2x on phones).
- **They move on their own**: breathing, blinking, capes and beards swaying,
  ghosts floating, flames flickering, wings flapping.
- **Real attack poses**: wind-up, strike and recovery. The knight swings his
  sword with a slash trail, the wizard and mentor raise glowing staffs, the
  debugger fires a pistol with a muzzle flash, monsters bite, slam and breathe.
- **Hits land**: melee fighters now run all the way to their target on any
  screen width, the target flinches and flashes, a defeated monster breaks
  into pixels, the hero cheers, and the next monster materialises.
- The hero cards on the character-select screen are animated, and the one you
  pick shows its attack.
- New files: `js/02a-sprite-engine.js`, `js/02b-hero-sprites.js`,
  `js/02c-monster-sprites.js`, `css/24-sprites.css`. To change how a hero or
  monster looks, edit its block in 02b or 02c.

## Changelog — coming back after EXIT TO TITLE

- After **EXIT TO TITLE** (Settings), **ENTER DUNGEON** now opens the login
  form with your username filled in. It used to open ADD USER with your own
  name in it, which could only answer "Username is already taken".
- Typing an existing username into ADD USER now switches to the login form
  (keeping the password you typed) instead of stopping with an error.
- A wrong password now shows its reason under the form; the message used to be
  wiped as soon as it appeared.
- Exiting saves your progress first.

## Changelog — refreshed home page

- A short battle now plays in front of the dungeon door: each hero in turn
  fights a different monster (floor 1 monsters first, then the rest and the
  bosses), with names underneath. The knight and the hacker run in to strike.
- **ENTER DUNGEON** is bigger and gently glows; a "Welcome back" line appears
  after you exit to the title.
- The three description lines are replaced by live numbers: PHP questions (from
  the question bank), monsters & bosses, heroes and lessons.
- A **Top Coders** strip shows the top three players; click it for the full
  leaderboard. It stays hidden until someone has a score.
- Laid out to fit a laptop screen without scrolling, and stacked for phones.
- New files: `public/js/23-home.js`, `public/css/25-home.css`.

## Changelog — project folders reorganised

- `public/js` and `public/css` are now grouped into folders by feature
  (`data`, `sprites`, `core`, `game`, `screens`, `admin` for scripts;
  `base`, `screens`, `game`, `overlays` for styles). The numbers were removed
  from file names; the load order now lives only in `js/loader.js` (scripts)
  and `index.html` (styles), each with a comment per file.
- The old `10-title-character-select.js` held three unrelated things and was
  split into `screens/home-door.js`, `screens/hero-select.js` and
  `core/music.js`.
- Screen partials were renamed to match what players see: `home.html`,
  `account.html`, `hero-select.html`, `study.html`.
- `server/questions_seed.json` moved to `server/data/`.
- `DEPLOY.md` and this history moved into `docs/`; the old single-file version
  of the game moved from `backup-original/` to `archive/original-version/`.
- Removed the empty `package-lock.json` at the top of the repository (there is
  no `package.json` there; the real one is in `server/`).
- No behaviour changed.

## Changelog — editable study materials

- Lessons are now stored in MongoDB (collection `lessons`) instead of being
  written into `study.html`. The 13 built-in lessons are added automatically on
  the next server start, from `server/data/lessons_seed.json`; they look exactly
  as before.
- New **STUDY MATERIALS** tab in the admin dashboard, right after QUESTIONS:
  edit any lesson, add new ones, change their order, delete them, and restore
  the built-in lessons. A live preview shows the lesson as players will see it,
  and the dashboard warns before throwing away unsaved changes.
- Lessons use a small text format (headings, paragraphs, lists, PHP code,
  output, tip and mistake boxes). Anything that looks like HTML is shown as
  plain text, so a lesson can never run code in players' browsers.
- Only signed-in admins can change lessons; anyone can read them.
- New files: `server/lib/lessons.js`, `server/routes/lessons.js`,
  `server/data/lessons_seed.json`, `public/js/core/lesson-format.js`,
  `public/js/screens/study.js`, `public/js/admin/admin-lessons.js`,
  `public/css/overlays/admin-lessons.css`.

## Changelog — hero missing after START NEW RUN

- Fixed: after dying, pressing **START NEW RUN** could leave the battle with no
  hero (only the HP bar). The hero's "fallen" pose is kept on screen behind the
  death screen on purpose, but a new run never cleared it. It is now cleared on
  every run reset, and an attack that was still landing when the player died
  can no longer knock down the hero of the next run. This mostly happened on
  the live site, where resetting the run takes a moment.

## Changelog — settings: volume and text size fixed

- **Text size now works.** The old "Font Size" option changed a value that no
  text on the page used, so nothing happened. Every font size in the CSS is now
  written as `calc(Npx * var(--text-scale,1))`, and Settings sets that one
  number: Small (90%), Normal (100%, the default), Large (115%) and Extra large
  (130%). Each screen was checked at Extra large on a laptop and a small phone.
  The logo and the attack-effect lettering keep their size because they are
  artwork.
- **Separate Music and Sound effects sliders.** Before, one slider controlled
  both, so music could not be turned down without losing the sound effects.
  Moving the Sound effects slider plays a short chime at the new level; at 0
  a slider shows "Off".
- Changes apply as you adjust them; SAVE CHANGES keeps them and CANCEL undoes
  them. Settings are remembered on this browser.
- The old saved font setting and the hidden "large text" switch are cleaned up
  automatically (the large-text switch becomes the new Large size).

## Changelog — home page background and polish

- New animated pixel-art night scene behind the home page
  (`public/js/screens/home-background.js`): dithered sky, a slow aurora,
  twinkling stars and the odd shooting star, a moon, three layers of
  mountains, a castle on a hill with flickering windows and waving flags, a
  far watchtower, drifting fog, rising embers and floating bits of PHP code.
  The scene shifts slightly with the mouse. It only animates while the home
  page is open, and shows a still picture when the device asks for reduced
  motion.
- STUDY MATERIALS, LEADERBOARD and HOW TO PLAY now share one calm style with a
  coloured pixel icon, so ENTER DUNGEON is the one bright button.
- Pixel icons on the numbers row and the Top Coders strip, a stone ledge under
  the dungeon door, a darker pool behind the centre so text stays readable,
  and a one-line description at the bottom on larger screens.

## Changelog — How to Play

- The BACK button is hidden on the first step of How to Play (there is
  nothing to go back to); it appears from step 2 on. NEXT stays on the right.

## Changelog — log in first, register from the bottom link

- **ENTER DUNGEON** now always opens the **PLAYER LOGIN** page (username and
  password only). At the bottom: "Don't have an account? **REGISTER**", which
  opens the register form (username, password, role, year level, block).
  The register form has "Already have an account? **LOG IN**" to go back.
- BACK on the register form returns to the login page; BACK on the login page
  returns home.
- The old "ADD USER" title is now "REGISTER". Typing a name that already has
  an account still switches to the login form, keeping the password.

## Changelog — Restart Game picks a hero and starts a new run

- **RESTART GAME** in Game Settings asks for confirmation, ends the current run
  (the score goes to the leaderboard), then opens hero select titled
  "NEW RUN: PICK A HERO". Your last hero is already selected.
- **START NEW RUN** starts floor 1 at full HP with the chosen hero. You stay
  signed in, so there is no login step.
- The chosen hero is saved to your account (`POST /players/:username/character`),
  so the next login preselects it.
- BACK on that screen returns home; ENTER DUNGEON from there works as usual.

## Changelog — Settings no longer changes the run

- Opening **Settings** in battle now pauses the question timer. Before, the
  timer kept counting behind the panel; if it ran out, the question counted as
  wrong and the hero lost HP while you were only changing volume or text size.
- **SAVE CHANGES** and **CANCEL** (or Escape) close the panel and the timer
  continues from the same second. Saving only stores volume and text size;
  HP, score, floor, gold and the current question stay exactly as they were.

## Changelog — EXIT TO TITLE does not save the run

- **EXIT TO TITLE** (Settings) now ends the run without keeping it. It asks
  first ("This run will not be saved"); CANCEL keeps playing.
- On exit the saved run is reset on the server (same as `/players/:username/reset`),
  so the next login starts again from floor 1 with full HP, 2 potions and no
  gold, after picking a hero. Your account and chosen hero stay.
- The run is not added to the leaderboard on exit (RESTART GAME and dying
  still add it). This replaces the earlier "EXIT TO TITLE keeps progress".

## Changelog — home page background: day and night

- The home page background now goes through a whole day in 2 minutes:
  sunrise, day, sunset and night. It starts at your real time of day.
- **Sunrise:** pink and orange sky, the sun comes up behind the castle while
  the moon sets over the watchtower.
- **Day:** blue sky, drifting clouds, flocks of birds, a green valley with
  pine trees and flowers, a stone castle with red roofs.
- **Sunset:** orange and red sky, the sun sets on the right, castle windows
  light up, the moon rises.
- **Night:** moon, stars, shooting stars, aurora, bats and fireflies (the
  old night scene).
- Sun and moon travel across the sky; colours fade smoothly between times of
  day. The dark overlay behind the menu is lighter by day; the footer line
  gets a dark backing by day so it stays readable.
- "Reduce motion" shows a still picture of the current time of day.
- For testing in the browser console: `setHomeTimeOfDay(0.5)` shows noon
  (0 = midnight, 0.25 = sunrise, 0.75 = sunset); `setHomeTimeOfDay(null)`
  lets the day run again.

## Changelog — battle background and fighter positions

- **New battle backgrounds.** Each floor is now a pixel-art place drawn at
  the same pixel size as the heroes and monsters (`js/game/battle-background.js`),
  replacing the old CSS shapes (`css/game/floor-backgrounds.css` is gone):
  1. Sunlit valley: sun with turning rays, drifting clouds, snowy mountains,
     a distant castle, a shimmering lake, pine trees, birds, a stone path.
  2. Crystal cavern: stalactites with water drips, glowing crystals, an
     underground pool, rising spores.
  3. Cyber defense: a data skyline, server racks with blinking lights,
     data packets, a scanning beam, a moving neon grid floor.
  4. Code matrix: falling code, terminal towers with a blinking cursor,
     a glowing platform.
  5. Inferno core: a volcano with lava streams and eruptions in the middle,
     smoke, a bubbling lava lake, embers. Boss fights add a red pulse.
- **Fighter positions fixed** (`css/game/battle-stage.css`):
  - Hero and monster face each other around the middle of the scene
    instead of hugging the screen edges, and both stand on the floor.
  - A plate under each fighter's feet: level + hero name + HP bar for the
    hero (green), name + HP bar for the monster (red; gold plate for bosses).
  - The monster description moved into the **Monster Stats** panel (it used
    to hang off the bottom of the scene).
  - Active buffs show in the top-left corner of the scene.
  - Speech bubble sits next to the hero's head; hit effects and ability
    labels (e.g. SHIELDED) appear on the fighters.
  - Sizes: 3x pixels on laptops, 2x on phones and tablets, 4x on large
    screens (1600x940 and up).

## Changelog — year level and block on the leaderboard

- The leaderboard has **YEAR** and **BLOCK** columns. Year levels read
  "1st Year", "2nd Year", "3rd Year", "4th Year". On phones they show as a
  line under the player's name ("2nd Year · Block 3").
- The values come from the player's account, so older scores saved before
  this change also show them, and a change made by an admin shows at once.
  Scores from someone without an account show "-".

## Changelog — home page: fighters in front of the door

- In the little battle on the home page, the hero and the monster are now
  drawn in front of the dungeon door. Before, the knight and the hacker ran
  behind the door when they attacked, and spells flew behind it.
- The attacking hero is drawn in front of the monster too
  (`css/screens/home-stage.css`).

## Changelog — home scene behind more screens

- The animated day-and-night valley from the home page is now also the
  background of **login / register**, **choose hero**, **How to Play** and
  **Study Materials**, a little dimmer there (`body[data-scene-bg="dim"]`
  in `css/screens/home-refresh.css`) with a soft dark centre so the panels
  stay easy to read. It is one scene shared by all these screens, so the sky
  and time of day carry on smoothly from page to page.
- The battle and the leaderboard keep their own backgrounds.
- Titles on hero select and Study Materials have a dark outline so the sun
  or moon behind them does not wash them out.
- Fix: the old shared page backdrop (stars, mist and a dark castle-wall
  silhouette, `.global-atmosphere` in `index.html`) was drawn over the bottom
  of the scene as black blocks. It is now hidden whenever the scene shows;
  the leaderboard still uses it.

## Changelog — home page battle: attack effects and turns

- The little battle on the home page now goes **hero → monster → hero**:
  the hero attacks, the monster strikes back, and the hero's second attack
  is the K.O. (`js/screens/home.js`, round of 6.4 s).
- Attack effects: pixel hit bursts, a sword slash for the knight and the
  hacker, coloured bolts for the scholar, wizard, mentor and debugger,
  damage numbers (gold on the monster, red on the hero), "K.O.!" with a
  bigger burst on the last hit, and a small screen shake on every hit.
- Monsters that fight up close run at the hero; ranged monsters (the ones
  in `ENEMY_DASH_FACTORS`) lean in and fire a bolt. The attacker is always
  drawn in front. Styles: "attack effects" in `css/screens/home-stage.css`.

## Changelog — leaderboard uses the home scene

- The **Leaderboard** now has the same day-and-night valley background as
  the home page, a little dimmer, like login, choose hero, How to Play and
  Study Materials. Only the battle keeps its own backgrounds.

## Changelog — attack effects fixed and special skills redone

- **Attack positions fixed.** Shots, hit effects, monster projectiles and
  boss skills used fixed spots from the old layout (145px from the edge,
  14% / 77% / 82% across), so they started and landed in the wrong places
  once the fighters moved toward the middle. Before every attack the game now
  measures where the hero and the monster stand (`--hx/--hy`, `--mx/--my`,
  `--shot` in `measureCombatDash()`), and every effect uses that.
- **New pixel-art hero attacks** (`js/game/battle-fx.js`, drawn on
  `#battle-fx-canvas` at the sprites' pixel size): a code page (Scholar),
  an arcane orb (Wizard), a light cross (Mentor) and a cannonball with muzzle
  flash and smoke (Debugger) fly from the hero's hand to the monster; the
  Knight lands a sword crescent and the Hacker three neon cuts. Every hit
  gets a pixel burst with sparks.
- **New special skills:**
  - TIME WARP: a giant clock over the monster rewinds, then shatters.
  - ARCANE BURST: rune circles, three spiralling orbs and a violet pillar.
  - AEGIS SLAM: a golden shield, a ground shockwave with flying rocks, and
    a shield glow on the knight (it blocks the next hit).
  - ZERO-DAY STRIKE: lock-on brackets, glitch lines, four neon cuts and a
    0-DAY stamp.
  - RESTORE PULSE: light gathers, a beam strikes the monster, healing rings
    and crosses around the mentor.
  - BOUNTY BREAK: a cannon, a big explosion, and coins flying to the debugger.
  Skills shake the scene on impact.
- The old CSS-drawn hero shots and skill effects were removed from
  `css/game/battle-animations.css`.

## Changelog — shop under the player badge, potions drunk from the shop

- **SHOP tab under your badge.** The SHOP button moved out of the left panel
  into a small gold tab hanging just under the player badge, top left
  (`#hud-shop-btn` in `pages/game.html`, styled in `css/game/hud.css`). It
  sits outside the header so the header stays the same height. The buff tags
  in that corner of the battle scene moved down to make room
  (`css/game/battle-stage.css`).
- **POTION button removed.** You still own potions (start with 2, +1 after
  every boss); you drink them from a new **Your potions: N — DRINK** card at
  the top of the shop (`overlays/shop.html`, styled in
  `css/overlays/account-and-shop.css`). It shows NONE LEFT and greys out at 0.
  The paid HP Potion below it is unchanged.
- `updatePotionDisplay()` (`js/core/feedback.js`) keeps the shop's potion
  count in step everywhere the old button label used to be updated. The
  tutorial and the "no potions" message now point to the shop.
- Removed the unused `.lex-panel-btns` and `.btn-potion` styles.

## Changelog — the UI fits every computer screen (16:9 base, zoomed)

- **Every screen is laid out at 1280x720 and zoomed to fill the window**
  (`public/js/core/ui-fit.js`, loaded in `<head>` before anything is drawn).
  A 1920x1080 monitor shows the same layout at 1.5x, a 1366x768 laptop at
  about 1.07x, 2560x1440 at 2x. A window made shorter by the browser's tabs
  and address bar zooms a little less, so nothing is cut off and nothing needs
  scrolling. Ultrawide windows get more room at the sides; 16:10 and 4:3
  screens get a bit more room at the bottom. Phones and portrait tablets
  (narrower than 1024px, or taller than wide) keep their own layout.
  Browser zoom (Ctrl +/-) no longer changes the size; the Settings text size
  still does.
- Stylesheets use `var(--app-w)` / `var(--app-h)` instead of `100vw` / `100vh`
  (CSS zoom would scale viewport units twice). The few `max-height` media
  queries became `html.vh-820` / `html.vh-700` classes, set from the zoomed
  height. Scripts that place effects measure with `uiRect()` instead of
  `getBoundingClientRect()`, so attacks still land on the fighters while zoomed
  (`battle.js`, `battle-fx.js`, `battle-background.js`, `feedback.js`,
  `home.js`).
- **Fitting 1280x720** (`public/css/base/screen-fit.css`, loaded last):
  - Pick a hero: tighter cards and a wider panel, so all six heroes and the
    buttons fit without scrolling.
  - Study: the title and lesson tabs stay put; only the lesson card scrolls.
  - Battle: the side panels lost a few pixels of padding so they no longer
    need their own scrollbar.
  - Long code questions (11-14 lines) used to push the answers below the
    question area. `fitQuestionToArea()` in `battle.js` now tightens such a
    question step by step (spacing, then answers in one row, then smaller
    code) until the answers are in sight. Short questions look the same as
    before; on 16:9 only 15 of the 125 questions need it.


## Changelog — big SHOP button in the left panel

- **SHOP is now a big gold button at the top of the battle's left panel**
  (`#shop-btn` in `pages/game.html`, styled in `css/game/question-panel.css`),
  instead of the small tab under the player badge. The tab and its styles in
  `css/game/hud.css` were removed, and the buff tags went back to the very top
  of the battle scene.
- To make room, **Streak and Encounter sit side by side** in two matching
  boxes. The Encounter box shows `1/3`, `2/3`, `3/3`, or `BOSS` in red during
  a boss fight (`spawnMonster()` / `spawnBoss()` in `js/game/battle.js`).
- **Boss fights fit 16:9 too.** The BOSS SPECIAL box made the right panel up to
  100px too tall, hiding Run Stats. During a boss fight on 16:9 screens, the
  panel now drops the DEF note and the boss skill description (as the hero's
  skill text is already dropped on the left) and shows Run Stats two by two.
  The right panel gets a `boss-fight` class from `updateMonsterUI()`; the rules
  are in `css/base/screen-fit.css`.

## Changelog — special skill under the hero

- **The special skill is now a button at the bottom of the hero's plate** in
  the battle scene (under LVL / name / HP), instead of the bottom of the left
  panel (`#character-special-btn` in `pages/game.html`, styled as
  `.plate-skill` in `css/game/battle-stage.css`). It shows:
  - a pixel icon for each hero's skill (hourglass, sparkle, shield, bolt,
    cross, bomb: `CHARACTER_SKILL_ICONS` in `js/data/heroes.js`, drawn by
    `drawSkillIcon()` in `js/game/battle.js`);
  - the skill name and a charge bar with the percentage;
  - gold with **READY** when fully charged, and a glowing, shining **USE!**
    button when it can be used on the current question. Hovering shows what
    the skill does.
- The scene's floor is taller to make room (`--ground` 62px to 100px, scene
  230px to 268px on 16:9; phones and other sizes adjusted the same way).
- The old SPECIAL SKILL block, its charge bar and the CHARGE button were
  removed from the left panel, with their styles.
- To keep 16:9 screens fitting with the taller scene, the right panel shows
  the monster's TYPE / HP / ATK / DEF two by two (`css/base/screen-fit.css`).
  All 125 questions still fit; the four longest use slightly smaller code.

## Changelog — skill under the player profile, SHOP under PTS / GOLD / FLOOR

- **The special skill moved from under the hero to a tab hanging under the
  player profile** (top left of the header). It keeps the same look: the
  skill's pixel icon, name, charge bar and percentage, gold READY when charged,
  and a glowing USE! button when it can be used. Markup: `#character-special-btn`
  inside `.lex-hud` in `pages/game.html`; styles: `.hud-skill` in
  `css/game/hud.css`.
- **SHOP moved from the left panel to a big gold tab hanging under
  PTS / GOLD / FLOOR** (top right of the header): `#shop-btn`, `.hud-shop-btn`
  in `css/game/hud.css`.
- With the skill off the hero's plate, the battle floor and scene are back to
  their earlier height (`--ground` 62px, scene 230px on 16:9), so questions get
  their room back (no question needs smaller code on 16:9). The monster stats
  in the right panel are back to one per row.
- The buff tags moved down under the skill tab. On phones and tablets the
  scene has 32px more sky so the tabs, the buff tags and the speech bubble
  don't cover each other.
- The tutorial says where the skill and the SHOP are now. The Debugger's bomb
  icon is lighter so it shows on the dark tab.
