import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { normalizeGig, saveGig } from '../src/pages/admin/services/gigs.ts';
import { buildDiaryEvents, eventsOnDay } from '../src/pages/admin/calendar.ts';

for (const [timestamp, expected] of [
  ['2026-05-31T23:00:00.000Z', '2026-06-01'],
  ['2026-12-01T00:00:00.000Z', '2026-12-01'],
  ['2026-06-01', '2026-06-01'],
]) {
  assert.equal(normalizeGig({ date: timestamp }).date, expected);
}
globalThis.localStorage = { getItem: () => 'test' };
globalThis.fetch = async () => new Response(JSON.stringify({
  _id: 'saved', venue: 'Test venue', date: '2026-05-31T23:00:00.000Z', startTime: '',
}), { status: 201 });
const saved = await saveGig({ venue: 'Test venue', date: '2026-06-01' });
assert.equal(saved._id, 'saved');
const events = buildDiaryEvents([saved], []);
assert.equal(eventsOnDay(events, DateTime.fromISO('2026-06-01', { zone: 'Europe/London' })).length, 1,
  'Saved response immediately blocks the booked UK day, without a second fetch');
assert.equal(eventsOnDay(events, DateTime.fromISO('2026-05-31', { zone: 'Europe/London' })).length, 0);
console.log('Saved booking state and UK summer/winter date regression checks passed.');
