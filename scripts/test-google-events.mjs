import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { DateTime } from 'luxon';
import handler from '../api/google-events.ts';
import { buildDiaryEvents, eventsOnDay, CALENDAR_ZONE } from '../src/pages/admin/calendar.ts';

process.env.JWT_SECRET = 'calendar-test-secret';
process.env.GOOGLE_CREDENTIALS = JSON.stringify({ client_email: 'test@example.com', private_key: 'test' });
delete process.env.GOOGLE_CALENDAR_ID;
const originalCalendar = google.calendar;
const absence = {
  id: 'absence', summary: 'Ross not available', transparency: 'transparent',
  start: { date: '2026-09-14' }, end: { date: '2026-09-19' },
};
google.calendar = () => ({ events: { list: async ({ calendarId }) => ({ data: { items:
  calendarId === 'soundwalkband@gmail.com'
    ? [absence, { ...absence, id: 'cancelled', status: 'cancelled' }]
    : [{ ...absence, id: 'free-gig-calendar-event' }],
} }) } });
try {
  let body;
  let status;
  await handler({
    headers: { origin: 'http://localhost:5173', authorization: `Bearer ${jwt.sign({ id: 'test' }, process.env.JWT_SECRET)}` },
    query: { timeMin: '2026-09-01T00:00:00Z', timeMax: '2026-10-01T00:00:00Z' },
  }, {
    status(code) { status = code; return this; },
    json(value) { body = value; },
  });
  assert.equal(status, 200);
  assert.deepEqual(body.items.map(event => event.id), ['absence']);
  assert.deepEqual(body.diagnostics.sources.map(source => source.eventCount), [1, 0]);
  const events = buildDiaryEvents([], body.items);
  for (let day = 14; day <= 18; day++) {
    assert.equal(eventsOnDay(events, DateTime.fromISO(`2026-09-${day}`, { zone: CALENDAR_ZONE })).length, 1,
      'Every absence date must block availability, even when Google marks it Free');
  }
  assert.equal(eventsOnDay(events, DateTime.fromISO('2026-09-19', { zone: CALENDAR_ZONE })).length, 0);
  console.log('Google feed absence coverage, cancelled events, and Free gig-calendar filtering passed.');
} finally {
  google.calendar = originalCalendar;
}
