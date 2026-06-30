'use strict';
// Manager-only user management. SDR accounts are created/managed here; all
// passwords are scrypt-hashed server-side and never returned to the client.
const { requireManager } = require('../lib/auth');
const users = require('../lib/users');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const mgr = requireManager(req);
  if (!mgr) return res.status(401).json({ error: 'Unauthorized' });
  if (!users.configured) return res.status(500).json({ error: 'User store not configured on the server' });

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ users: await users.listUsers() });
    }

    if (req.method === 'POST') {
      const { name, username, password, role } = readBody(req);
      const u = await users.createUser({
        name, username, password,
        role: role === 'manager' ? 'manager' : 'sdr',
        createdBy: mgr.uid,
      });
      return res.status(201).json({ user: u });
    }

    if (req.method === 'PATCH') {
      const { id, name, status, password, username } = readBody(req);
      if (!id) return res.status(400).json({ error: 'id is required' });
      const u = await users.updateUser(id, { name, status, password, username });
      if (!u) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user: u });
    }

    if (req.method === 'DELETE') {
      const { id } = readBody(req);
      if (!id) return res.status(400).json({ error: 'id is required' });
      if (id === mgr.uid) return res.status(400).json({ error: 'You cannot delete your own account' });
      const target = await users.getById(id);
      if (target && target.role === 'manager' && (await users.countManagers()) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last manager' });
      }
      await users.deleteUser(id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
