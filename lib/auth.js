'use strict';
// Tiny stateless HMAC-signed token — no external dependency.
const crypto = require('crypto');

function secret() {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return body + '.' + sig;
}

function verify(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let data;
  try { data = JSON.parse(b64urlDecode(body)); } catch (e) { return null; }
  if (data.exp && Date.now() > data.exp) return null;
  return data;
}

// constant-time string compare for credentials
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function tokenData(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const token = String(h).replace(/^Bearer\s+/i, '').trim();
  return verify(token);
}
// Any authenticated user (manager or sdr)
function requireAuth(req) { return tokenData(req); }
// Manager only ('admin' kept for backward-compatibility with older tokens)
function requireManager(req) {
  const d = tokenData(req);
  return d && (d.role === 'manager' || d.role === 'admin') ? d : null;
}
// Legacy alias used by the bookings API
function isAdmin(req) { return !!requireManager(req); }

module.exports = { sign, verify, safeEqual, isAdmin, requireAuth, requireManager, tokenData };
