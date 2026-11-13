const crypto = require('crypto');

const PASSWORD_MIN_LENGTH = 6;

function createPasswordRecord(password) {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString('hex');
  return { passwordSalt, passwordHash };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  if (!passwordSalt || !passwordHash) return false;
  const candidate = crypto.scryptSync(password, passwordSalt, 64);
  const stored = Buffer.from(passwordHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

module.exports = { PASSWORD_MIN_LENGTH, createPasswordRecord, verifyPassword };
