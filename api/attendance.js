'use strict';
// Attendance / time tracking. SDR clocks self in/out; manager sees everyone.
const { requireAuth } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const isMgr = (u) => u.role === 'manager' || u.role === 'admin';
const today = () => new Date().toISOString().slice(0, 10);
const BREAK_LIMIT = 3600000; // 1 hour
function totalBreakMs(rec) { if (!rec || !rec.breaks) return 0; return rec.breaks.reduce((a, br) => a + ((br.end || Date.now()) - br.start), 0); }
function fmtDur(ms) { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h > 0 ? (h + 'h ' + (m % 60) + 'm') : (m + 'm'); }
// When an SDR crosses the 1h break limit, log a system activity entry once/day.
// System entries (userId:'system') are only surfaced to managers by /api/activity.
async function maybeFlagBreak(rec, me) {
  if (!rec || rec.breakAlertSent) return rec;
  if (totalBreakMs(rec) > BREAK_LIMIT) {
    try {
      await crm.put('activity', { id: crm.rid('ac'), userId: 'system', userName: 'System',
        action: '⚠️ ' + (me.name || 'An SDR') + ' crossed the 1-hour break limit today (' + fmtDur(totalBreakMs(rec)) + ')', ts: Date.now() });
    } catch (e) { /* never block on the alert */ }
    return await crm.patch('attendance', rec.id, { breakAlertSent: true });
  }
  return rec;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const me = requireAuth(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    if (req.method === 'GET') {
      let recs = await crm.list('attendance');
      if (!isMgr(me)) recs = recs.filter((a) => a.userId === me.uid);
      recs.sort((a, b) => (b.clockIn || 0) - (a.clockIn || 0));
      return res.status(200).json({ attendance: recs });
    }

    if (req.method === 'POST') {
      const b = readBody(req);
      const action = b.action || 'in';
      const recs = await crm.list('attendance');
      let rec = recs.find((a) => a.userId === me.uid && a.date === today());

      if (action === 'in') {
        if (rec && rec.clockIn) return res.status(400).json({ error: 'Already clocked in today' });
        rec = { id: crm.rid('at'), userId: me.uid, userName: me.name, date: today(), clockIn: Date.now(), clockOut: null, status: 'present', breaks: [] };
        return res.status(201).json({ record: await crm.put('attendance', rec) });
      }
      if (!rec || !rec.clockIn) return res.status(400).json({ error: 'You have not clocked in yet' });

      if (action === 'break-start') {
        if (rec.clockOut) return res.status(400).json({ error: 'Your shift is already over' });
        rec.breaks = rec.breaks || [];
        if (rec.breaks.some((br) => !br.end)) return res.status(400).json({ error: 'You are already on a break' });
        rec.breaks.push({ start: Date.now(), end: null });
        let out = await crm.patch('attendance', rec.id, { breaks: rec.breaks });
        out = await maybeFlagBreak(out, me);
        return res.status(200).json({ record: out });
      }
      if (action === 'break-end') {
        rec.breaks = rec.breaks || [];
        const active = rec.breaks.find((br) => !br.end);
        if (!active) return res.status(400).json({ error: 'You are not on a break' });
        active.end = Date.now();
        let out = await crm.patch('attendance', rec.id, { breaks: rec.breaks });
        out = await maybeFlagBreak(out, me);
        return res.status(200).json({ record: out });
      }
      if (action === 'break-check') {
        // lightweight poll from the SDR client while on a long break
        return res.status(200).json({ record: await maybeFlagBreak(rec, me) });
      }

      // action === 'out' — auto-close any open break on clock out
      if (rec.clockOut) return res.status(400).json({ error: 'Already clocked out today' });
      const breaks = (rec.breaks || []).map((br) => (br.end ? br : Object.assign({}, br, { end: Date.now() })));
      let out = await crm.patch('attendance', rec.id, { clockOut: Date.now(), breaks });
      out = await maybeFlagBreak(out, me);
      return res.status(200).json({ record: out });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
