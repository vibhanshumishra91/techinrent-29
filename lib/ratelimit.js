'use strict';
// Lightweight login rate-limiter backed by Upstash Redis.
// Fails OPEN if storage is unavailable (never locks people out due to infra).
const { Redis } = require('@upstash/redis');

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function client() { if (!redis && url && token) redis = new Redis({ url, token }); return redis; }

const MAX = 8;        // allowed attempts...
const WINDOW = 900;   // ...per 15 minutes, per username+IP

async function hit(key) {
  const c = client();
  if (!c) return { allowed: true, remaining: MAX };
  try {
    const k = 'rl:' + key;
    const n = await c.incr(k);
    if (n === 1) await c.expire(k, WINDOW);
    return { allowed: n <= MAX, remaining: Math.max(0, MAX - n) };
  } catch (e) { return { allowed: true, remaining: MAX }; }
}
async function reset(key) {
  const c = client();
  if (!c) return;
  try { await c.del('rl:' + key); } catch (e) { /* ignore */ }
}

module.exports = { hit, reset, MAX, WINDOW };
