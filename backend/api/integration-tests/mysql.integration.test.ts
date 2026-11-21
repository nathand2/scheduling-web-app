const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', 'mysql']);
if (!allowedHosts.has(process.env.DB_HOST) || process.env.DB_DATABASE !== 'scheduler_test') {
  throw new Error('Integration tests require a local MySQL host and DB_DATABASE=scheduler_test.');
}

const db = require('../db');

after(async () => {
  await db.closePool();
});

test('persists a session, membership, and availability range in MySQL', async () => {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `test${unique}`.slice(0, 25);
  const displayName = 'Integration User';
  const userId = await db.createLocalUser(username, 'test-password-hash', displayName);
  const sessionCode = unique.slice(-8);
  const start = '2032-03-10T18:00:00.000Z';
  const end = '2032-03-10T22:00:00.000Z';

  const sessionId = await db.createSession(
    sessionCode,
    'Integration test session',
    start,
    end,
    'account-only'
  );
  const userSessionId = await db.createUserSession(userId, sessionId, 'owner');

  const authorizedSession = await db.getSession(userId, sessionCode);
  assert.equal(authorizedSession.status, 200);
  assert.equal(authorizedSession.session.id, sessionId);

  const otherUserId = await db.createLocalUser(
    `other${unique}`.slice(0, 25),
    'test-password-hash',
    'Other User'
  );
  const unauthorizedSession = await db.getSession(otherUserId, sessionCode);
  assert.equal(unauthorizedSession.status, 403);

  const rangeId = await db.createSessionTimeRange(
    userId,
    sessionId,
    '2032-03-10T19:00:00.000Z',
    '2032-03-10T20:00:00.000Z',
    'going'
  );
  const ranges = await db.getSessionTimeRanges(sessionId);
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].id, rangeId);
  assert.equal(ranges[0].display_name, displayName);
  assert.equal(ranges[0].status, 'going');

  const deletion = await db.deleteSessionTimeRangeByIdAndUserId(
    userId,
    rangeId,
    userSessionId
  );
  assert.equal(deletion.affectedRows, 1);
  assert.equal((await db.getSessionTimeRanges(sessionId)).length, 0);
});
