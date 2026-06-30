'use strict';
// Booking persistence backed by Upstash Redis (Vercel Marketplace / KV).
// Works with either the Vercel KV env names or the native Upstash ones.
const { Redis } = require('@upstash/redis');

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function client() {
  if (!url || !token) {
    throw new Error('Storage not configured: missing KV/Upstash REST URL or token');
  }
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

const KEY = 'bookings'; // a Redis hash: field = booking id, value = JSON

function parse(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v; // @upstash/redis may auto-deserialize
  try { return JSON.parse(v); } catch (e) { return null; }
}

async function addBooking(b) {
  await client().hset(KEY, { [b.id]: JSON.stringify(b) });
  return b;
}

async function listBookings() {
  const all = (await client().hgetall(KEY)) || {};
  return Object.values(all)
    .map(parse)
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function updateBooking(id, patch) {
  const cur = parse(await client().hget(KEY, id));
  if (!cur) return null;
  const next = Object.assign({}, cur, patch, { id: cur.id, updatedAt: Date.now() });
  await client().hset(KEY, { [id]: JSON.stringify(next) });
  return next;
}

async function deleteBooking(id) {
  await client().hdel(KEY, id);
}

module.exports = { addBooking, listBookings, updateBooking, deleteBooking, configured: !!(url && token) };
