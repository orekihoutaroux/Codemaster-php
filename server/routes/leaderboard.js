const express = require('express');

module.exports = function leaderboardRoutes(db) {
  const router = express.Router();

  router.get('/leaderboard', async (req, res) => {
    try {
      const rows = await db.collection('leaderboard')
        .find({}, { projection: { _id: 0 } })
        .sort({ score: -1, createdAt: 1 })
        .toArray();
      // One row per player: rows are score-sorted, so the first row seen for a
      // name is that player's best run. Without this a single player who dies
      // often fills the whole board.
      const seen = new Set();
      const best = [];
      for (const row of rows) {
        const key = String(row.name || '').trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        best.push(row);
        if (best.length === 50) break;
      }
      // Year level and block come from the player's account (so a change made
      // by an admin shows here too); the values saved with the score are the
      // fallback for players without an account. '-' means unknown.
      const names = best.map((row) => String(row.name || '').trim()).filter(Boolean);
      const players = names.length
        ? await db.collection('players')
          .find({ username: { $in: names } }, { projection: { _id: 0, username: 1, profile: 1 } })
          .toArray()
        : [];
      const profiles = new Map(players.map((p) => [p.username, p.profile || {}]));
      const known = (value) => {
        const text = String(value == null ? '' : value).trim();
        return text && text !== '-' ? text : '';
      };
      const ranked = best.map((row, i) => {
        const profile = profiles.get(String(row.name || '').trim()) || {};
        return {
          rank: i + 1,
          ...row,
          yearLevel: known(profile.yearLevel) || known(row.yearLevel) || '-',
          block: known(profile.block) || known(row.block) || '-'
        };
      });
      res.json({ status: 'ok', leaderboard: ranked });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load leaderboard' });
    }
  });

  router.post('/leaderboard', async (req, res) => {
    try {
      const body = req.body || {};
      const row = {
        name: String(body.name || '').trim().slice(0, 24) || 'Anonymous',
        character: String(body.character || '').trim().slice(0, 40),
        score: Math.max(0, parseInt(body.score, 10) || 0),
        floor: Math.max(1, parseInt(body.floor, 10) || 1),
        role: String(body.role || 'Student').trim().slice(0, 20),
        yearLevel: String(body.yearLevel || '-').trim().slice(0, 10),
        block: String(body.block || '-').trim().slice(0, 10),
        createdAt: new Date()
      };
      if (row.score <= 0) {
        return res.status(400).json({ status: 'error', message: 'Score must be greater than zero' });
      }
      await db.collection('leaderboard').insertOne(row);
      res.json({ status: 'ok' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to submit score' });
    }
  });

  return router;
};
