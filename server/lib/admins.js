const crypto = require('crypto');
const { PASSWORD_MIN_LENGTH, createPasswordRecord, verifyPassword } = require('./passwords');

// Admin accounts live in the "admins" collection with hashed passwords, and a
// successful login creates a session in "admin_sessions". Only a hash of each
// session token is stored, so a copy of the database cannot be used to log in.
const SESSION_HOURS = 12;
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,24}$/;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function validateNewAdmin(username, password) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-24 letters, numbers, dots, dashes or underscores';
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
    return `Password must be ${PASSWORD_MIN_LENGTH} to 128 characters`;
  }
  return null;
}

// The first boot creates one admin so the dashboard is reachable. Set
// ADMIN_USERNAME / ADMIN_PASSWORD to choose it; otherwise it is the game's
// original admin / admin123, which you should replace from MANAGE ADMINS.
async function ensureDefaultAdmin(db) {
  const admins = db.collection('admins');
  if ((await admins.countDocuments({})) > 0) return null;

  const username = normalizeUsername(process.env.ADMIN_USERNAME) || 'admin';
  const password = String(process.env.ADMIN_PASSWORD || 'admin123');
  const now = new Date();
  await admins.insertOne({
    username,
    usernameLower: username.toLowerCase(),
    ...createPasswordRecord(password),
    createdBy: 'system',
    createdAt: now,
    updatedAt: now
  });
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`[admin] Created default admin "${username}" with the default password. Add your own admin and remove this one.`);
  } else {
    console.log(`[admin] Created admin "${username}" from ADMIN_USERNAME / ADMIN_PASSWORD.`);
  }
  return username;
}

async function loginAdmin(db, username, password) {
  const admin = await db.collection('admins').findOne({ usernameLower: normalizeUsername(username).toLowerCase() });
  if (!admin || !verifyPassword(String(password || ''), admin.passwordSalt, admin.passwordHash)) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  await db.collection('admin_sessions').insertOne({
    tokenHash: hashToken(token),
    username: admin.username,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_HOURS * 3600 * 1000)
  });
  await db.collection('admins').updateOne({ username: admin.username }, { $set: { lastLoginAt: now } });
  return { token, username: admin.username, expiresInHours: SESSION_HOURS };
}

async function findSession(db, token) {
  if (!token) return null;
  const session = await db.collection('admin_sessions').findOne({ tokenHash: hashToken(token) });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await db.collection('admin_sessions').deleteOne({ tokenHash: session.tokenHash });
    return null;
  }
  // A deleted admin loses access immediately.
  const admin = await db.collection('admins').findOne({ username: session.username });
  return admin ? session : null;
}

function readBearerToken(req) {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

// Express middleware: lets the request through only with a valid admin session.
function requireAdmin(db) {
  return async function requireAdminSession(req, res, next) {
    try {
      const session = await findSession(db, readBearerToken(req));
      if (!session) {
        return res.status(401).json({ status: 'error', code: 'admin_auth_required', message: 'Admin login required' });
      }
      req.adminUsername = session.username;
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function logoutAdmin(db, token) {
  if (token) await db.collection('admin_sessions').deleteOne({ tokenHash: hashToken(token) });
}

async function listAdmins(db) {
  return db.collection('admins')
    .find({}, { projection: { _id: 0, username: 1, createdBy: 1, createdAt: 1, lastLoginAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();
}

async function addAdmin(db, username, password, createdBy) {
  const name = normalizeUsername(username);
  const pass = String(password || '');
  const problem = validateNewAdmin(name, pass);
  if (problem) return { error: problem, status: 400 };

  const admins = db.collection('admins');
  if (await admins.findOne({ usernameLower: name.toLowerCase() })) {
    return { error: 'An admin with that username already exists', status: 409 };
  }
  const now = new Date();
  await admins.insertOne({
    username: name,
    usernameLower: name.toLowerCase(),
    ...createPasswordRecord(pass),
    createdBy,
    createdAt: now,
    updatedAt: now
  });
  return { admin: { username: name, createdBy, createdAt: now } };
}

async function removeAdmin(db, username, requestedBy) {
  const name = normalizeUsername(username);
  if (name === requestedBy) return { error: 'You cannot remove the admin you are logged in as', status: 400 };
  const admins = db.collection('admins');
  if ((await admins.countDocuments({})) <= 1) return { error: 'At least one admin must remain', status: 400 };
  const result = await admins.deleteOne({ username: name });
  if (!result.deletedCount) return { error: 'Admin not found', status: 404 };
  await db.collection('admin_sessions').deleteMany({ username: name });
  return { removed: name };
}

module.exports = {
  ensureDefaultAdmin,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
  readBearerToken,
  listAdmins,
  addAdmin,
  removeAdmin
};
