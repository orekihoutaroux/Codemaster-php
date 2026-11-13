const express = require('express');
const { PASSWORD_MIN_LENGTH, createPasswordRecord, verifyPassword } = require('../lib/passwords');
const { DEFAULT_STATE, createDefaultState, getDefaultProgression, normalizeProgression } = require('../lib/state');

module.exports = function authRoutes(db) {
  const router = express.Router();

  // Create an account after hero selection. Existing accounts must provide the
  // correct password and keep all saved progress.
  router.post('/players/:username/start', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      if (!username) {
        return res.status(400).json({ status: 'error', message: 'Username is required' });
      }

      const body = req.body || {};
      const password = String(body.password || '');
      if (password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
        return res.status(400).json({ status: 'error', message: 'Password must be 6 to 128 characters' });
      }
      const profile = {
        role: String(body.role || 'Student').trim().slice(0, 20),
        yearLevel: String(body.yearLevel || '').trim().slice(0, 10),
        block: String(body.block || '').trim().slice(0, 10),
        character: String(body.character || '').trim().slice(0, 40)
      };
      const now = new Date();
      const existing = await db.collection('players').findOne({ username });
      let created = false;

      if (existing) {
        if (existing.passwordHash && !verifyPassword(password, existing.passwordSalt, existing.passwordHash)) {
          return res.status(401).json({ status: 'error', message: 'Username already exists or password is incorrect' });
        }
        const update = { username, profile, updatedAt: now };
        // Legacy player rows are upgraded the first time their owner completes
        // hero selection with a password.
        if (!existing.passwordHash) Object.assign(update, createPasswordRecord(password));
        await db.collection('players').updateOne({ username }, { $set: update });
      } else {
        const passwordRecord = createPasswordRecord(password);
        await db.collection('players').insertOne({
          username,
          profile,
          state: createDefaultState(profile.character),
          progression: getDefaultProgression(),
          ...passwordRecord,
          createdAt: now,
          updatedAt: now
        });
        created = true;
      }

      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, username: 1, profile: 1, state: 1, progression: 1, createdAt: 1, updatedAt: 1 } }
      );

      res.json({
        status: 'ok',
        created,
        player
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to start player' });
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const body = req.body || {};
      const username = String(body.username || '').trim().slice(0, 24);
      const password = String(body.password || '');
      const player = await db.collection('players').findOne({ username });

      if (!player || !verifyPassword(password, player.passwordSalt, player.passwordHash)) {
        return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
      }

      res.json({
        status: 'ok',
        player: {
          username: player.username,
          profile: player.profile || null,
          state: player.state || { ...DEFAULT_STATE },
          progression: normalizeProgression(player.progression, player.state),
          updatedAt: player.updatedAt
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to log in' });
    }
  });

  return router;
};
