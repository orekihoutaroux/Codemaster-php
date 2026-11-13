const express = require('express');
const { DEFAULT_STATE, createDefaultState, normalizeProgression } = require('../lib/state');

module.exports = function playersRoutes(db) {
  const router = express.Router();

  router.get('/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const doc = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, username: 1, profile: 1, state: 1, progression: 1, updatedAt: 1 } }
      );
      if (!doc) return res.json({ status: 'not_found', state: null });
      res.json({
        status: 'ok',
        username: doc.username,
        profile: doc.profile || null,
        state: doc.state,
        progression: normalizeProgression(doc.progression, doc.state),
        updatedAt: doc.updatedAt
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load player state' });
    }
  });

  router.post('/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      if (!username) {
        return res.status(400).json({ status: 'error', message: 'Username is required' });
      }
      if (!req.body || !req.body.state || typeof req.body.state !== 'object' || Array.isArray(req.body.state)) {
        return res.status(400).json({ status: 'error', message: 'A state object is required' });
      }
      let state = req.body.state;
      const clientSavedAt = Number(req.body && req.body.savedAt) || 0;
      const existing = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, levelResetAt: 1, progressResetAt: 1 } }
      );
      if (existing && existing.progressResetAt && clientSavedAt && clientSavedAt < new Date(existing.progressResetAt).getTime()) {
        state = { ...DEFAULT_STATE };
      } else if (existing && existing.levelResetAt && clientSavedAt && clientSavedAt < new Date(existing.levelResetAt).getTime()) {
        state = { ...state, level: 1 };
      }
      const updatedAt = new Date();
      await db.collection('players').updateOne(
        { username },
        { $set: { username, state, updatedAt } },
        { upsert: true }
      );
      res.json({ status: 'ok', updatedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to save player state' });
    }
  });

  router.post('/players/:username/reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, profile: 1 } }
      );
      const resetState = createDefaultState(player && player.profile && player.profile.character);
      await db.collection('players').updateOne(
        { username },
        { $set: { username, state: resetState, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ status: 'ok', state: resetState });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset player state' });
    }
  });

  router.post('/players/:username/level/reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const updatedAt = new Date();
      const result = await db.collection('players').updateOne(
        { username },
        { $set: { 'state.level': 1, levelResetAt: updatedAt, updatedAt } }
      );
      if (!result.matchedCount) {
        return res.status(404).json({ status: 'not_found', message: 'Player not found' });
      }
      res.json({ status: 'ok', level: 1, updatedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset player level' });
    }
  });

  // Preserve the completed/interrupted run, then start the player with a clean
  // active state. The client sends its immediate local cache so a reload cannot
  // lose progress that had not finished reaching MongoDB yet.
  router.post('/players/:username/progress/archive-reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const player = await db.collection('players').findOne({ username });
      if (!player) {
        return res.status(404).json({ status: 'not_found', message: 'Player not found' });
      }

      const body = req.body || {};
      const submittedState = body.state && typeof body.state === 'object' ? body.state : null;
      const submittedAt = Number(body.savedAt) || 0;
      const serverUpdatedAt = player.updatedAt ? new Date(player.updatedAt).getTime() : 0;
      const archivedState = submittedState && submittedAt >= serverUpdatedAt
        ? submittedState
        : (player.state || { ...DEFAULT_STATE });
      const archivedAt = new Date();

      const archive = await db.collection('player_progress_history').insertOne({
        username,
        profile: player.profile || null,
        state: archivedState,
        reason: 'page_reload',
        sourceSavedAt: submittedAt ? new Date(submittedAt) : player.updatedAt,
        archivedAt
      });

      await db.collection('players').updateOne(
        { username },
        {
          $set: {
            state: createDefaultState(player.profile && player.profile.character),
            progressResetAt: archivedAt,
            updatedAt: archivedAt
          }
        }
      );

      res.json({
        status: 'ok',
        archived: true,
        archiveId: String(archive.insertedId),
        state: createDefaultState(player.profile && player.profile.character),
        updatedAt: archivedAt
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to archive and reset progress' });
    }
  });

  // Admin: list every saved player (for the "Manage Users" panel).
  router.get('/players', async (req, res) => {
    try {
      const docs = await db.collection('players')
        .find({}, { projection: { _id: 0, username: 1, profile: 1, state: 1, createdAt: 1, updatedAt: 1 } })
        .sort({ updatedAt: -1 })
        .toArray();
      const players = docs.map((d) => ({ username: d.username, updatedAt: d.updatedAt, state: d.state }));
      res.json({ status: 'ok', players });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load players' });
    }
  });

  // Admin: combine saved players with everyone who appears on the leaderboard.
  // A leaderboard-only user gets a preview state and can be promoted to a saved
  // player from the admin panel without changing their leaderboard history.
  router.get('/admin/users', async (req, res) => {
    try {
      const [playerDocs, leaderboardRows] = await Promise.all([
        db.collection('players')
          .find({}, { projection: { _id: 0, username: 1, profile: 1, state: 1, createdAt: 1, updatedAt: 1 } })
          .toArray(),
        db.collection('leaderboard')
          .find({}, { projection: { _id: 0 } })
          .sort({ score: -1, createdAt: -1 })
          .toArray()
      ]);

      const usersByName = new Map();

      playerDocs.forEach((player) => {
        const username = String(player.username || '').trim();
        if (!username) return;
        usersByName.set(username.toLowerCase(), {
          username,
          updatedAt: player.updatedAt,
          state: player.state || { ...DEFAULT_STATE },
          profile: player.profile || null,
          leaderboardOnly: false,
          leaderboard: null
        });
      });

      leaderboardRows.forEach((row, index) => {
        const username = String(row.name || '').trim();
        if (!username) return;
        const key = username.toLowerCase();
        const leaderboard = {
          rank: index + 1,
          score: parseInt(row.score, 10) || 0,
          floor: parseInt(row.floor, 10) || 1,
          character: String(row.character || ''),
          role: String(row.role || ''),
          yearLevel: String(row.yearLevel || ''),
          block: String(row.block || ''),
          createdAt: row.createdAt
        };

        if (usersByName.has(key)) {
          // Rows are score-sorted, so the first matching row is the best result.
          const existing = usersByName.get(key);
          if (!existing.leaderboard) existing.leaderboard = leaderboard;
          return;
        }

        usersByName.set(key, {
          username,
          updatedAt: row.createdAt,
          state: {
            ...DEFAULT_STATE,
            score: leaderboard.score,
            floor: leaderboard.floor
          },
          leaderboardOnly: true,
          leaderboard
        });
      });

      const users = Array.from(usersByName.values()).sort((a, b) => {
        const aScore = parseInt(a.state && a.state.score, 10) || 0;
        const bScore = parseInt(b.state && b.state.score, 10) || 0;
        return bScore - aScore || a.username.localeCompare(b.username);
      });

      res.json({ status: 'ok', players: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load admin users' });
    }
  });

  // Admin: permanently delete a player's save.
  router.delete('/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const result = await db.collection('players').deleteOne({ username });
      res.json({ status: 'ok', deleted: result.deletedCount > 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to delete player' });
    }
  });

  return router;
};
