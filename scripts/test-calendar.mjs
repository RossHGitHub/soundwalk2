import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { buildDiaryEvents, eventsOnDay, monthDays, CALENDAR_ZONE } from '../src/pages/admin/calendar.ts';
const day = iso => DateTime.fromISO(iso, { zone: CALENDAR_ZONE });
const events = buildDiaryEvents([{ _id: 'gig', venue: 'Test gig', date: '2026-10-24', startTime: '23:00' }], [
  { id: 'holiday', title: 'Time off', startISO: '2026-10-30T00:00:00+00:00', endISO: '2026-11-03T00:00:00+00:00', allDay: true },
  { id: 'mirror', title: 'Gig at Test gig', startISO: '2026-10-24T23:00:00+01:00', endISO: '2026-10-25T01:00:00+01:00' },
]);
assert.equal(events.length, 2, 'Mirrored gigs are not duplicated');
assert.equal(eventsOnDay(events, day('2026-10-24')).length, 1);
assert.equal(eventsOnDay(events, day('2026-10-25')).length, 1, 'Overnight gigs block both dates across DST');
assert.equal(eventsOnDay(events, day('2026-10-26')).length, 0);
assert.equal(eventsOnDay(events, day('2026-11-01')).length, 1, 'Time off blocks intervening dates and month boundaries');
assert.equal(eventsOnDay(events, day('2026-11-02')).length, 1);
assert.equal(eventsOnDay(events, day('2026-11-03')).length, 0, 'Exclusive all-day end remains available');
const midnightEnd = buildDiaryEvents([], [{ id:'end', title:'Busy', startISO:'2026-10-10T21:00:00+01:00', endISO:'2026-10-11T00:00:00+01:00' }]);
assert.equal(eventsOnDay(midnightEnd, day('2026-10-11')).length, 0);
for (const month of ['2026-02', '2026-03', '2026-08', '2026-12', '2028-02']) {
 const days = monthDays(month);
 assert.equal(days[0].weekday, 1);
 assert.equal(days.length % 7, 0);
 assert.equal(days.filter(value => value.toFormat('yyyy-MM') === month).length, day(`${month}-01`).daysInMonth);
}
console.log('Calendar date coverage, multi-day time off, exclusive ends, deduplication and DST checks passed.');
