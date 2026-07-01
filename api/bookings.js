'use strict';
const store = require('../lib/store');
const { isAdmin } = require('../lib/auth');

const STATUSES = ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
function clean(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 500); }
function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    // ---- Public: create a booking -----------------------------------------
    if (req.method === 'POST') {
      const b = readBody(req);
      const fullName = clean(b.fullName || b.name, 120);
      const email = clean(b.email, 160);
      if (!fullName) return res.status(400).json({ error: 'Full name is required' });
      if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });

      const booking = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        fullName,
        company: clean(b.company, 120),
        email,
        phone: clean(b.phone, 40),
        service: clean(b.service, 80),
        preferredAt: clean(b.preferredAt, 60),
        message: clean(b.message, 2000),
        source: clean(b.source || 'Website', 40),
        status: 'New',
        createdAt: Date.now()
      };
      await store.addBooking(booking);
      // Surface the new booking in the shared activity feed / notifications bell.
      try {
        const crm = require('../lib/crmstore');
        await crm.put('activity', { id: crm.rid('ac'), userId: 'system', userName: 'Website', action: 'New demo booking from ' + (booking.fullName || 'a visitor'), ts: Date.now() });
      } catch (e) { /* never block a booking on the activity log */ }
      return res.status(201).json({ ok: true, id: booking.id });
    }

    // ---- Admin only: list -------------------------------------------------
    if (req.method === 'GET') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const bookings = await store.listBookings();
      return res.status(200).json({ ok: true, bookings, statuses: STATUSES });
    }

    // ---- Admin only: update status ---------------------------------------
    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { id, status } = readBody(req);
      if (!id) return res.status(400).json({ error: 'id is required' });
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const updated = await store.updateBooking(id, { status });
      if (!updated) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json({ ok: true, booking: updated });
    }

    // ---- Admin only: delete ----------------------------------------------
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = readBody(req);
      if (!id) return res.status(400).json({ error: 'id is required' });
      await store.deleteBooking(id);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String((e && e.message) || e) });
  }
};
