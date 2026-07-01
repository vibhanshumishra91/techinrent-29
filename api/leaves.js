'use strict';
// Leave requests. SDR applies (own); manager approves/rejects. Policy: 1 paid
// leave day per calendar month per person — the rest are unpaid. Paid/unpaid is
// computed at approval time based on paid days already used that month.
const { requireAuth } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const isMgr = (u) => u.role === 'manager' || u.role === 'admin';
const DAY = 86400000;
const monthKey = (d) => String(d || '').slice(0, 7); // YYYY-MM
function dayCount(from, to) {
  const a = new Date(from + 'T00:00:00'), b = new Date((to || from) + 'T00:00:00');
  if (isNaN(a) || isNaN(b) || b < a) return 0;
  return Math.round((b - a) / DAY) + 1;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const me = requireAuth(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    if (req.method === 'GET') {
      let leaves = await crm.list('leaves');
      if (!isMgr(me)) leaves = leaves.filter((l) => l.userId === me.uid);
      leaves.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));
      // Paid days already used this month, per requester (for the SDR balance display)
      const mk = monthKey(new Date().toISOString());
      const paidUsed = (await crm.list('leaves'))
        .filter((l) => l.userId === me.uid && l.status === 'approved' && monthKey(l.fromDate) === mk)
        .reduce((s, l) => s + (l.paidDays || 0), 0);
      return res.status(200).json({ leaves, paidUsedThisMonth: paidUsed, paidPerMonth: 1 });
    }

    if (req.method === 'POST') {
      const b = readBody(req);
      const fromDate = String(b.fromDate || '').slice(0, 10);
      const toDate = String(b.toDate || fromDate).slice(0, 10);
      const reason = String(b.reason || '').trim().slice(0, 500);
      const days = dayCount(fromDate, toDate);
      if (!fromDate || !days) return res.status(400).json({ error: 'Please provide valid From/To dates' });
      if (!reason) return res.status(400).json({ error: 'A reason is required' });
      const leave = {
        id: crm.rid('lv'), userId: me.uid, userName: me.name,
        fromDate, toDate, days, reason, status: 'pending',
        paidDays: 0, unpaidDays: 0, appliedAt: Date.now(),
        decidedBy: null, decidedByName: null, decidedAt: null, managerNote: '',
      };
      await crm.put('leaves', leave);
      return res.status(201).json({ leave });
    }

    if (req.method === 'PATCH') {
      if (!isMgr(me)) return res.status(403).json({ error: 'Only a manager can approve or reject leave' });
      const b = readBody(req);
      if (!b.id) return res.status(400).json({ error: 'id required' });
      const cur = await crm.get('leaves', b.id);
      if (!cur) return res.status(404).json({ error: 'Leave not found' });
      const status = b.status === 'approved' ? 'approved' : (b.status === 'rejected' ? 'rejected' : cur.status);
      let paidDays = 0, unpaidDays = 0;
      if (status === 'approved') {
        const mk = monthKey(cur.fromDate);
        const usedPaid = (await crm.list('leaves'))
          .filter((l) => l.userId === cur.userId && l.status === 'approved' && l.id !== cur.id && monthKey(l.fromDate) === mk)
          .reduce((s, l) => s + (l.paidDays || 0), 0);
        paidDays = Math.max(0, Math.min(1 - usedPaid, cur.days));
        unpaidDays = cur.days - paidDays;
      }
      const updated = await crm.patch('leaves', b.id, {
        status, paidDays, unpaidDays,
        decidedBy: me.uid, decidedByName: me.name, decidedAt: Date.now(),
        managerNote: b.note !== undefined ? String(b.note).slice(0, 300) : cur.managerNote,
      });
      return res.status(200).json({ leave: updated });
    }

    if (req.method === 'DELETE') {
      const b = readBody(req);
      if (!b.id) return res.status(400).json({ error: 'id required' });
      const cur = await crm.get('leaves', b.id);
      if (!cur) return res.status(404).json({ error: 'Leave not found' });
      if (!isMgr(me) && (cur.userId !== me.uid || cur.status !== 'pending')) {
        return res.status(403).json({ error: 'You can only cancel your own pending requests' });
      }
      await crm.del('leaves', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
