'use strict';

const { requiredString } = require('../core/validation');

const WARNING_TYPE = 'warning';

class NotFoundError extends Error {
  constructor(message = 'Notification not found.') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

function recipientId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error('A valid recipient is required.');
    error.statusCode = 401;
    throw error;
  }
  return id;
}

function present(row) {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title || row.type,
    message: row.message || '',
    createdAt: row.createdAt || row.created_at || null,
    read: Boolean(row.isRead ?? row.is_read)
  };
}

/**
 * Notification use-cases over a storage port.
 *
 * Required port methods:
 * listForRecipient(recipientId, { unreadOnly, limit })
 * markReadForRecipient(recipientId, notificationId, { warnings })
 * markAllReadForRecipient(recipientId)
 * deleteForRecipient(recipientId, notificationId)
 * deleteAllForRecipient(recipientId)
 *
 * The adapter must scope every mutation by recipient ID in the database query.
 */
function createNotificationService(repository) {
  for (const method of [
    'listForRecipient',
    'markReadForRecipient',
    'markAllReadForRecipient',
    'deleteForRecipient',
    'deleteAllForRecipient'
  ]) {
    if (!repository || typeof repository[method] !== 'function') {
      throw new TypeError(`Notification repository must implement ${method}()`);
    }
  }

  async function list(userId, { unreadOnly = false, limit = 100 } = {}) {
    const owner = recipientId(userId);
    const rows = await repository.listForRecipient(owner, {
      unreadOnly: Boolean(unreadOnly),
      limit: Math.min(100, Math.max(1, Number(limit) || 100))
    });
    return rows.map(present);
  }

  async function markRead(userId, notificationId) {
    const owner = recipientId(userId);
    const id = requiredString(String(notificationId ?? ''), 'notificationId', 128);
    const result = await repository.markReadForRecipient(owner, id, { warnings: false });
    if (!result) throw new NotFoundError('Notification not found or requires warning acknowledgement.');
    return { ok: true };
  }

  async function acknowledgeWarning(userId, notificationId) {
    const owner = recipientId(userId);
    const id = requiredString(String(notificationId ?? ''), 'notificationId', 128);
    const result = await repository.markReadForRecipient(owner, id, { warnings: true, onlyUnread: true });
    if (!result) throw new NotFoundError('Warning not found or already acknowledged.');
    return { ok: true };
  }

  async function markAllRead(userId) {
    const owner = recipientId(userId);
    return { ok: true, updated: await repository.markAllReadForRecipient(owner, { excludeType: WARNING_TYPE }) };
  }

  async function remove(userId, notificationId) {
    const owner = recipientId(userId);
    const id = requiredString(String(notificationId ?? ''), 'notificationId', 128);
    const result = await repository.deleteForRecipient(owner, id, { excludeType: WARNING_TYPE });
    if (!result) throw new NotFoundError('Notification not found or cannot be removed.');
    return { ok: true };
  }

  async function clear(userId) {
    const owner = recipientId(userId);
    return { ok: true, deleted: await repository.deleteAllForRecipient(owner, { excludeType: WARNING_TYPE }) };
  }

  return Object.freeze({ list, markRead, acknowledgeWarning, markAllRead, remove, clear });
}

module.exports = { createNotificationService, NotFoundError, WARNING_TYPE };
