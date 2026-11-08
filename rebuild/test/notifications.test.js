'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createNotificationService, NotFoundError } = require('../src/notifications/service');

function fakeRepository() {
  const rows = [
    { id: 1, userId: 7, type: 'friend', title: 'Friend request', message: 'Hello', isRead: false },
    { id: 2, userId: 7, type: 'warning', title: 'Warning', message: 'Read this', isRead: false },
    { id: 3, userId: 8, type: 'friend', title: 'Private', message: 'Other user', isRead: false }
  ];
  return {
    rows,
    async listForRecipient(userId, options) {
      return rows.filter(row => row.userId === userId && (!options.unreadOnly || !row.isRead)).slice(0, options.limit);
    },
    async markReadForRecipient(userId, id, options) {
      const row = rows.find(item => item.userId === userId && String(item.id) === id &&
        (options.warnings ? item.type === 'warning' && (!options.onlyUnread || !item.isRead) : item.type !== 'warning'));
      if (!row) return false;
      row.isRead = true;
      return true;
    },
    async markAllReadForRecipient(userId, options) {
      let count = 0;
      for (const row of rows) if (row.userId === userId && row.type !== options.excludeType && !row.isRead) {
        row.isRead = true;
        count++;
      }
      return count;
    },
    async deleteForRecipient(userId, id, options) {
      const index = rows.findIndex(row => row.userId === userId && String(row.id) === id && row.type !== options.excludeType);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
    async deleteAllForRecipient(userId, options) {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].userId === userId && rows[i].type !== options.excludeType) rows.splice(i, 1);
      }
      return before - rows.length;
    }
  };
}

test('notification list is scoped to the authenticated recipient', async () => {
  const service = createNotificationService(fakeRepository());
  const rows = await service.list(7);
  assert.equal(rows.length, 2);
  assert.equal(rows.some(row => row.message === 'Other user'), false);
});

test('bulk read leaves warning notices untouched', async () => {
  const repository = fakeRepository();
  const service = createNotificationService(repository);
  await service.markAllRead(7);
  assert.equal(repository.rows.find(row => row.id === 1).isRead, true);
  assert.equal(repository.rows.find(row => row.id === 2).isRead, false);
});

test('warning acknowledgement is a separate explicit action', async () => {
  const repository = fakeRepository();
  const service = createNotificationService(repository);
  await assert.rejects(() => service.markRead(7, 2), NotFoundError);
  await service.acknowledgeWarning(7, 2);
  assert.equal(repository.rows.find(row => row.id === 2).isRead, true);
});

test('a user cannot read or delete another user notification', async () => {
  const service = createNotificationService(fakeRepository());
  await assert.rejects(() => service.markRead(7, 3), NotFoundError);
  await assert.rejects(() => service.remove(7, 3), NotFoundError);
});

test('clear and individual removal preserve warnings', async () => {
  const repository = fakeRepository();
  const service = createNotificationService(repository);
  await service.remove(7, 1);
  const result = await service.clear(7);
  assert.equal(result.deleted, 0);
  assert.equal(repository.rows.some(row => row.id === 2), true);
});
