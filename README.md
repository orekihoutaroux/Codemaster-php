# CodeMaster PHP

A roguelike quiz game for learning PHP. Pick a hero, enter the dungeon and
answer PHP questions to attack monsters; wrong answers let them hit back.
Includes a 13-lesson PHP course, a leaderboard and an admin dashboard for
questions, categories, players and admins.

- **Frontend:** plain HTML, CSS and JavaScript in `public/` (no build step).
- **Backend:** Node.js + Express in `server/`, storing everything in MongoDB.
- **Online:** MongoDB Atlas + Render, see [docs/DEPLOY.md](docs/DEPLOY.md).
- **History of changes:** [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Contents

1. [Run it on your computer](#run-it-on-your-computer)
2. [How the project is organised](#how-the-project-is-organised)
3. [Where do I change...?](#where-do-i-change)
4. [How the page is put together](#how-the-page-is-put-together)
5. [API reference](#api-reference)

## Run it on your computer

### 1. Get a MongoDB instance

The easiest option is **MongoDB Atlas** (free, hosted, no install):

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

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env` and paste your real connection string into `MONGODB_URI`.

### 3. Install dependencies and seed the database

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

### 4. Run it

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

## How the project is organised

```
codemaster-php/
├── README.md                  ← you are here
├── render.yaml                how Render builds and runs the site
├── docs/
│   ├── DEPLOY.md              putting the game online for free
│   └── CHANGELOG.md           what changed and when
├── archive/
│   └── original-version/      the old single-file game, kept for reference
│
├── public/                    EVERYTHING THE BROWSER LOADS
│   ├── index.html             empty shell: styles + js/loader.js
│   ├── pages/                 one HTML file per screen
│   │   ├── home.html            title page
│   │   ├── account.html         create account / log in
│   │   ├── hero-select.html     pick a hero
│   │   ├── tutorial.html        How to Play
│   │   ├── game.html            the dungeon
│   │   ├── study.html           13 PHP lessons
│   │   └── leaderboard.html
│   ├── overlays/              pop-up panels shown over a screen
│   │   ├── settings.html  shop.html  account-info.html
│   │   └── admin-login.html  admin.html  admin-reset-confirm.html
│   ├── js/
│   │   ├── loader.js          loads the pages, then every script IN ORDER
│   │   ├── data/              game content: heroes, monsters, offline questions
│   │   ├── sprites/           how heroes and monsters are drawn and animated
│   │   ├── core/              shared plumbing: state, saving, server calls,
│   │   │                      navigation, sound, music, startup
│   │   ├── game/              the dungeon: battle, timer, shop
│   │   ├── screens/           home, account, hero select, tutorial,
│   │   │                      leaderboard, settings
│   │   └── admin/             admin login and dashboard
│   └── css/
│       ├── base/              colours, fonts, shared layout, mobile, accessibility
│       ├── screens/           one file per screen
│       ├── game/              dungeon HUD, question panel, battle effects, sprites
│       └── overlays/          settings, shop, account and admin panels
│
└── server/                    THE API AND DATABASE
    ├── server.js              starts Express, mounts the routes, serves public/
    ├── db.js                  MongoDB connection and indexes
    ├── seed.js                optional: fill the question bank by hand
    ├── data/
    │   └── questions_seed.json  the 125 built-in questions
    ├── routes/                one file per group of /api URLs
    │   ├── questions.js  categories.js  players.js  progression.js
    │   ├── auth.js  admins.js  leaderboard.js  health.js
    ├── lib/                   logic shared by the routes
    │   ├── questions.js       loads the seed file, saves admin edits
    │   ├── categories.js      question categories
    │   ├── admins.js          admin accounts and sessions
    │   ├── passwords.js       password hashing
    │   └── state.js           a new player's starting state
    ├── .env.example           copy to .env and add your MongoDB address
    └── package.json
```

## Where do I change...?

| I want to change...                          | Edit                                                         |
|----------------------------------------------|--------------------------------------------------------------|
| A hero's stats, colours or special skill     | `public/js/data/heroes.js`                                   |
| A monster's or boss's stats, or which floor  | `public/js/data/monsters.js`                                 |
| How a hero looks or animates                 | `public/js/sprites/hero-sprites.js`                          |
| How a monster or boss looks or animates      | `public/js/sprites/monster-sprites.js`                       |
| Damage, points, gold, levels, floors         | `public/js/game/battle.js` and `public/js/data/monsters.js`  |
| The question time limit                      | `TIMER_MAX` in `public/js/core/state.js` (countdown in `public/js/game/timer.js`) |
| Shop items and prices                        | `public/overlays/shop.html`, `buyShopItem()` in `public/js/core/feedback.js` and the prices in `public/js/core/api.js` |
| The built-in questions                       | `server/data/questions_seed.json` (new ids are added to the database on the next start) |
| The lessons in Study Materials               | `public/pages/study.html`                                    |
| The home page                                | `public/pages/home.html`, `public/js/screens/home.js`, `public/css/screens/home*.css` |
| Account creation and login                   | `public/pages/account.html`, `public/js/screens/account.js`  |
| Moving between screens                       | `showScreen()` in `public/js/core/navigation.js`             |
| Sound effects / music                        | `public/js/core/audio.js` / `public/js/core/music.js`        |
| The admin dashboard                          | `public/overlays/admin.html`, `public/js/admin/admin-panel.js` |
| Phone layout                                 | `public/css/base/mobile.css` (plus the `@media` blocks in each file) |
| An API endpoint                              | the matching file in `server/routes/`                        |

## How the page is put together

`index.html` is only a shell. When it opens, `js/loader.js`:

1. downloads every file in `pages/` and `overlays/` and puts them on the page
   (only one screen is visible at a time; `showScreen('id')` switches),
2. loads the scripts one after another in the order of its `SCRIPTS` list,
3. shows the game.

**Order matters.** Scripts can only use what earlier scripts defined when
they first run, and for styles the later file wins when two rules clash. So:

- adding a script: put it in the right `js/` folder and add it to `SCRIPTS`
  in `js/loader.js` (each line has a comment saying what the file does);
- adding a stylesheet: put it in the right `css/` folder and add a `<link>`
  in `index.html`, usually at the end.

Functions are global on purpose so the `onclick="..."` attributes in the HTML
files can call them.

## API reference

All routes start with `/api`. Routes marked *admin* need an admin session
(sent automatically by the admin dashboard).

| Method | Route                                      | Purpose                                   |
|--------|--------------------------------------------|-------------------------------------------|
| GET    | `/health`                                  | Is the server up?                         |
| GET    | `/questions`                               | The question bank                         |
| POST   | `/admin/questions`                         | Add or edit a question (*admin*)          |
| POST   | `/admin/questions/reset`                   | Restore built-in questions (*admin*)      |
| GET    | `/admin/categories`                        | List categories (*admin*)                 |
| POST   | `/admin/categories`                        | Add a category (*admin*)                  |
| DELETE | `/admin/categories/:name`                  | Delete an unused category (*admin*)       |
| POST   | `/players/:username/start`                 | Create a player account                   |
| POST   | `/auth/login`                              | Player login                              |
| GET    | `/players/:username`                       | Load a player's saved run                 |
| POST   | `/players/:username`                       | Save a player's run                       |
| POST   | `/players/:username/reset`                 | Reset a player's run                      |
| GET    | `/players/:username/progression`           | Levels and achievements                   |
| POST   | `/players/:username/progression/event`     | Record a progression event                |
| GET    | `/admin/users`                             | List players (*admin*)                    |
| DELETE | `/players/:username`                       | Delete a player (*admin*)                 |
| POST   | `/admin/login`, `/admin/logout`            | Admin session                             |
| GET    | `/admin/admins`                            | List admins (*admin*)                     |
| POST   | `/admin/admins`                            | Add an admin (*admin*)                    |
| DELETE | `/admin/admins/:username`                  | Remove an admin (*admin*)                 |
| GET    | `/leaderboard`                             | Best score per player, top 50             |
| POST   | `/leaderboard`                             | Submit a finished run                     |
