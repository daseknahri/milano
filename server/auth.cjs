const crypto = require('node:crypto');

const COOKIE_NAME = 'milan_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 200;
const MAX_ATTEMPT_KEYS = 2000;
const sessions = new Map();
const loginAttempts = new Map();

const secret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@milan-auto.local').trim().toLowerCase();
const adminUsername = String(process.env.ADMIN_USERNAME || adminEmail).trim().toLowerCase();
const adminPassword = String(process.env.ADMIN_PASSWORD || 'change-me-now');

function validateAuthConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = [];
  if (!process.env.ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) missing.push('ADMIN_PASSWORD (12 caractères minimum)');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) missing.push('SESSION_SECRET (32 caractères minimum)');
  if (missing.length) throw new Error(`Configuration de production incomplète : ${missing.join(', ')}`);
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left)).digest();
  const rightHash = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function signature(id) {
  return crypto.createHmac('sha256', secret).update(id).digest('base64url');
}

function createToken() {
  pruneAuthState();
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((left, right) => left[1].createdAt - right[1].createdAt)[0];
    if (oldest) sessions.delete(oldest[0]);
  }
  const id = crypto.randomBytes(32).toString('base64url');
  sessions.set(id, { createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
  return `${id}.${signature(id)}`;
}

function tokenId(token) {
  pruneAuthState();
  const [id, providedSignature] = String(token || '').split('.');
  if (!id || !providedSignature || !safeEqual(signature(id), providedSignature)) return null;
  const session = sessions.get(id);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(id);
    return null;
  }
  return id;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    priority: 'high',
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

function pruneAuthState(now = Date.now()) {
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
  for (const [key, attempts] of loginAttempts) {
    const recent = attempts.filter((time) => time > now - LOGIN_WINDOW_MS);
    if (recent.length) loginAttempts.set(key, recent);
    else loginAttempts.delete(key);
  }
  while (loginAttempts.size > MAX_ATTEMPT_KEYS) {
    loginAttempts.delete(loginAttempts.keys().next().value);
  }
}

function attemptKeys(ip, identifier) {
  return [`ip:${String(ip || 'unknown')}`, `id:${String(identifier || 'unknown')}`];
}

function isRateLimited(ip, identifier) {
  pruneAuthState();
  const now = Date.now();
  const [ipKey, identifierKey] = attemptKeys(ip, identifier);
  const ipRecent = (loginAttempts.get(ipKey) || []).filter((time) => time > now - LOGIN_WINDOW_MS);
  const identifierRecent = (loginAttempts.get(identifierKey) || []).filter((time) => time > now - LOGIN_WINDOW_MS);
  loginAttempts.set(ipKey, ipRecent);
  loginAttempts.set(identifierKey, identifierRecent);
  return ipRecent.length >= 8 || identifierRecent.length >= 12;
}

function recordFailure(ip, identifier) {
  for (const key of attemptKeys(ip, identifier)) {
    loginAttempts.set(key, [...(loginAttempts.get(key) || []), Date.now()].slice(-16));
  }
}

function clearFailures(ip, identifier) {
  for (const key of attemptKeys(ip, identifier)) loginAttempts.delete(key);
}

function login(req, res) {
  const identifier = String(req.body?.email || req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (isRateLimited(req.ip, identifier)) {
    res.set('Retry-After', String(Math.ceil(LOGIN_WINDOW_MS / 1000)));
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  const matchesEmail = safeEqual(identifier, adminEmail);
  const matchesUsername = safeEqual(identifier, adminUsername);
  if ((!matchesEmail && !matchesUsername) || !safeEqual(password, adminPassword)) {
    recordFailure(req.ip, identifier);
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }
  clearFailures(req.ip, identifier);
  res.cookie(COOKIE_NAME, createToken(), cookieOptions());
  return res.json({ authenticated: true, email: adminEmail, username: adminUsername });
}

function logout(req, res) {
  const id = tokenId(req.cookies?.[COOKIE_NAME]);
  if (id) sessions.delete(id);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return res.json({ authenticated: false });
}

function getSession(req, res) {
  const authenticated = Boolean(tokenId(req.cookies?.[COOKIE_NAME]));
  return res.json({
    authenticated,
    ...(authenticated ? { email: adminEmail, username: adminUsername } : {}),
  });
}

function requireAdmin(req, res, next) {
  if (!tokenId(req.cookies?.[COOKIE_NAME])) return res.status(401).json({ error: 'Authentification requise.' });
  return next();
}

module.exports = { login, logout, getSession, requireAdmin, validateAuthConfig };
