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
