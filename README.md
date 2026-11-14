# CodeMaster PHP — now backed by MongoDB

Your game used to keep everything (player progress, question bank, leaderboard)
in the browser's `localStorage`. It now talks to a small Express API that reads
and writes MongoDB. Here's what changed and how to run it.

## What changed

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

## Putting it online

To publish the game on the internet for free, see **[DEPLOY.md](DEPLOY.md)**
(MongoDB Atlas + Render, no credit card). The rest of this file is about
running it on your own machine.

## 1. Get a MongoDB instance

You said you weren't sure where MongoDB should run — easiest path is **MongoDB
Atlas** (free, hosted, no install):

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free "M0" cluster (takes ~a minute to provision).
3. Under **Database Access**, add a database user with a password.
4. Under **Network Access**, add your current IP (or `0.0.0.0/0` while testing —
   just don't leave that open in production).
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net
   ```

**Alternative — run MongoDB locally instead** (if you'd rather not use the cloud):
- macOS: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- Docker (any OS): `docker run -d -p 27017:27017 --name mongo mongo:7`
- Then your connection string is just `mongodb://127.0.0.1:27017`

## 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env` and paste your real connection string into `MONGODB_URI`.

## 3. Install dependencies and seed the database

```bash
cd server
npm install
npm run seed
```

`npm install` is required. `npm run seed` is **optional**: the server fills the
question bank itself on startup. Run it only if you want the questions in
MongoDB before starting the game. It is safe to re-run — questions already
stored are left alone. Player accounts and leaderboard rows are never seeded;
they are created by real players.

## 4. Run it

```bash
npm start
```

You'll see:
```
[db] Connected to MongoDB -> db "codemaster_php"
[server] CodeMaster PHP running at http://localhost:3000
```

Open **http://localhost:3000** — that's the game, served by the same Express
server that hosts the API, so there's no CORS setup to worry about.

## Project layout

The frontend is assembled at runtime: `index.html` is only a shell, and
`js/loader.js` injects the page/overlay partials before loading the ordered
game modules. Edit the small file for the area you are debugging.

```
codemaster-php/
├── public/                     # served as static files by Express
│   ├── index.html              # shell: shared background + CSS links + loader
│   ├── pages/                  # one HTML partial per screen
│   │   ├── title.html
│   │   ├── leaderboard.html
│   │   ├── add-user.html
│   │   ├── select.html
│   │   ├── learn.html
│   │   └── game.html
│   ├── overlays/               # one HTML partial per overlay
│   │   ├── account-info.html
│   │   ├── shop.html
│   │   ├── settings.html
│   │   ├── admin-login.html
│   │   ├── admin.html
│   │   └── admin-reset-confirm.html
│   ├── js/                     # game logic, one file per former app.js section
│   │   ├── loader.js           # fetches partials, then loads 01..20 in order
│   │   └── 01-drawing-characters.js ... 20-startup.js
│   └── css/                    # one stylesheet per former styles.css section
│       └── 01-foundation.css ... 20-typography-extras.css
└── server/
    ├── server.js               # bootstrap: mounts routers and starts Express
    ├── db.js                   # MongoDB connection + indexes
    ├── routes/                 # one router per API domain, mounted at /api
    │   ├── health.js
    │   ├── questions.js
    │   ├── players.js
    │   ├── progression.js
    │   ├── auth.js
    │   └── leaderboard.js
    ├── lib/                    # shared server helpers
    │   ├── state.js            # default state, achievements, progression
    │   ├── passwords.js        # scrypt hashing/verification
    │   └── questions.js        # merged question bank + migration
    ├── seed.js
    ├── questions_seed.json
    ├── .env.example
    └── package.json
```

`backup-original/` holds the pre-modular `index.html`, `app.js`, `styles.css`,
and `server.js` for comparison or rollback; you can delete it once you're happy.

## API reference

| Method | Route                          | Purpose                                   |
|--------|---------------------------------|--------------------------------------------|
| GET    | `/api/questions`                | Question bank from MongoDB                |
| POST   | `/api/admin/questions`          | Create/update one question in MongoDB     |
| POST   | `/api/admin/questions/reset`    | Restore starter questions, keep added ones|
| GET    | `/api/players`                  | List every saved player (admin)           |
| GET    | `/api/players/:username`        | Load a player's saved run                 |
| POST   | `/api/players/:username`        | Save a player's current run               |
| POST   | `/api/players/:username/reset`  | Reset a player's run to defaults          |
| DELETE | `/api/players/:username`        | Delete a player's save (admin)            |
| GET    | `/api/leaderboard`              | Top 50 scores, ranked                     |
| POST   | `/api/leaderboard`               | Submit a completed run's score            |

## Notes / things worth knowing

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
