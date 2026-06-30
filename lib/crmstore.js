'use strict';
// Server-side CRM collections backed by Upstash Redis. Each collection is a
// Redis hash (id -> JSON). Role scoping is enforced by the API layer, not here.
const { Redis } = require('@upstash/redis');

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function client() {
  if (!url || !token) throw new Error('Storage not configured: missing KV/Upstash REST credentials');
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

const COLLECTIONS = { leads: 'crm:leads', reports: 'crm:reports', attendance: 'crm:attendance', activity: 'crm:activity', partners: 'crm:partners', posts: 'crm:posts' };
function key(coll) { const k = COLLECTIONS[coll]; if (!k) throw new Error('Unknown collection: ' + coll); return k; }

function parse(v) { if (v == null) return null; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch (e) { return null; } }
function rid(prefix) { return (prefix || 'i') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

async function list(coll) {
  const all = (await client().hgetall(key(coll))) || {};
  return Object.values(all).map(parse).filter(Boolean);
}
async function get(coll, id) { return parse(await client().hget(key(coll), id)); }
async function put(coll, item) {
  if (!item.id) item.id = rid(coll.slice(0, 2));
  item.updatedAt = Date.now();
  if (!item.createdAt) item.createdAt = item.updatedAt;
  await client().hset(key(coll), { [item.id]: JSON.stringify(item) });
  return item;
}
async function patch(coll, id, fields) {
  const cur = await get(coll, id);
  if (!cur) return null;
  const next = Object.assign({}, cur, fields, { id: cur.id, createdAt: cur.createdAt, updatedAt: Date.now() });
  await client().hset(key(coll), { [id]: JSON.stringify(next) });
  return next;
}
async function del(coll, id) { await client().hdel(key(coll), id); }

module.exports = { list, get, put, patch, del, rid, configured: !!(url && token) };
