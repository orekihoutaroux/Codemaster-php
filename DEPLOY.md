# Putting CodeMaster PHP online for free

The game needs a machine that runs Node and a MongoDB database, so a static
host like GitHub Pages cannot run it. The free combination that works:

| Piece | Free service | Limits |
|-------|--------------|--------|
| The database | **MongoDB Atlas M0** | 512 MB, free forever, no card |
| The server + game | **Render** free web service | 512 MB RAM, 750 hours/month, no card |

Everything in this repository is already set up for it. Total time: about 20
minutes, most of it waiting.

---

## 1. Create the database (MongoDB Atlas)

1. Sign up at <https://www.mongodb.com/cloud/atlas/register>.
2. Create a free **M0** cluster (any provider/region; pick one near you).
3. **Database Access** > Add New Database User. Give it a username and a
   password, and **write the password down** - you need it in a moment.
   Use a password with no `@ : / ?` in it, or you will have to URL-encode it.
4. **Network Access** > Add IP Address > **Allow access from anywhere**
   (`0.0.0.0/0`). Render's free machines have no fixed address, so Atlas has to
   accept all of them.
5. **Connect > Drivers** and copy the connection string. It looks like:

   ```
   mongodb+srv://myuser:<db_password>@cluster0.ab1cd.mongodb.net/?retryWrites=true&w=majority
   ```

   Replace `<db_password>` with the real password from step 3. Keep this string
   private - it is the key to your database.

## 2. Put the code on GitHub

If you have the `git` command:

```bash
cd codemaster-php
git init
git add .
git commit -m "CodeMaster PHP"
```

Then create an **empty** repository on <https://github.com/new> and run the two
commands GitHub shows you (`git remote add origin ...` and `git push -u origin main`).

No git installed? On the GitHub repository page use **Add file > Upload files**
and drag in the project folder - but delete `server/node_modules` first, it is
large and Render reinstalls it anyway.

`.gitignore` already keeps `node_modules` and `.env` out, so your database
password is never uploaded.

## 3. Deploy on Render

1. Sign up at <https://render.com> with your GitHub account.
2. **New > Blueprint**, pick this repository, and Render reads `render.yaml`:
   it already knows to build from the `server` folder and run `npm start`.
3. It will ask for the **MONGODB_URI** value. Paste the Atlas connection
   string from step 1.
4. **Apply** / **Create**. The first build takes a few minutes.

If Blueprint is not offered, use **New > Web Service** instead and set:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables: `MONGODB_URI` = your Atlas string, and
  `DB_NAME` = `codemaster_php`

## 4. Check it

Your address is something like `https://codemaster-php.onrender.com`.

- Open `/api/health` first - it should answer `{"status":"ok"}`.
- Open the address itself to play.
- Render's **Logs** tab should show:

  ```
  [db] Connected to MongoDB -> db "codemaster_php"
  [db] Stored 25 starter question(s) in MongoDB.
  [server] CodeMaster PHP listening on port 10000
  ```

The question bank seeds itself on that first boot, so there is nothing to run
by hand. In Atlas, **Browse Collections** will show `questions` with 25 rows,
and `players` and `leaderboard` filling up as people play.

---

## Things to know about the free tier

- **It sleeps.** After 15 minutes with no visitors Render stops the service,
  and the next person waits roughly a minute for it to wake. Fine for a demo or
  a class presentation; open the link a minute before you show it.
- **750 hours a month** is enough for one service running continuously.
- Every `git push` redeploys automatically.
- Atlas M0 never expires. (Render's own free *Postgres* expires after 30 days -
  that does not apply here, the data is in Atlas.)

## Before you share the link

The admin dashboard is **not protected on the server**. The login (click the
logo 5 times, `admin` / `admin123`) is only a check inside the browser, and the
`/api/admin/*` routes answer anyone who calls them directly. On your own
laptop that does not matter. On a public address, anyone who finds it can edit
the questions or delete player saves.

Ask Claude for "real admin auth on the server" before you hand the link around.
