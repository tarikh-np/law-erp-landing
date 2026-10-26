/* Bikram Sambat ↔ Gregorian engine tests.
   Run with: npm test   (node --test tests/) */
const test = require('node:test');
const assert = require('node:assert/strict');
const dates = require('../js/bs-ad.js');

test('the documented example converts both ways', () => {
  const ad = dates.bsToAd({ year: 2080, month: 11, day: 18 });
  assert.deepEqual(ad, { year: 2024, month: 3, day: 1 });

  const bs = dates.adToBs({ year: 2024, month: 3, day: 1 });
  assert.deepEqual(bs, { year: 2080, month: 11, day: 18 });

  assert.equal(dates.monthName(bs.month), 'Falgun');
  assert.equal(bs.day, 18);
  assert.equal(dates.weekdayName(dates.weekdayOf(ad)), 'Friday');
  assert.equal(dates.legalDayNumber(dates.weekdayOf(ad)), 6);
  assert.equal(dates.legalDateLine(bs, dates.weekdayOf(ad)), '2080 saal 11 mahina 18 gatey 6 roj');
});

test('each weekday maps to the legal number, Saturday has none', () => {
  /* 2024-03-03 is a Sunday; walk one week forward. */
  const expected = [1, 2, 3, 4, 5, 6, null];
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i < 7; i++) {
    const ad = { year: 2024, month: 3, day: 3 + i };
    assert.equal(dates.weekdayName(dates.weekdayOf(ad)), names[i]);
    assert.equal(dates.legalDayNumber(dates.weekdayOf(ad)), expected[i], names[i]);
  }
  const saturday = dates.bsToAd({ year: 2080, month: 11, day: 19 });
  assert.equal(dates.weekdayName(dates.weekdayOf(saturday)), 'Saturday');
  assert.equal(dates.legalDayNumber(dates.weekdayOf(saturday)), null);
  assert.equal(dates.legalDateLine(dates.adToBs(saturday), dates.weekdayOf(saturday)), null);
});

test('invalid BS dates are rejected, never rolled forward', () => {
  assert.equal(dates.isValidBs({ year: 2083, month: 2, day: 32 }), false);
  assert.equal(dates.bsToAd({ year: 2083, month: 2, day: 32 }), null);
  assert.equal(dates.isValidBs({ year: 2083, month: 13, day: 1 }), false);
  assert.equal(dates.isValidBs({ year: 2083, month: 0, day: 10 }), false);
  assert.equal(dates.isValidBs({ year: 2083, month: 6, day: 0 }), false);
  assert.equal(dates.isValidBs({ year: 1999, month: 12, day: 30 }), false);
  assert.equal(dates.isValidBs({ year: 2091, month: 1, day: 1 }), false);
});

test('invalid AD dates are rejected, never rolled forward', () => {
  assert.equal(dates.isValidAd({ year: 2023, month: 2, day: 29 }), false);
  assert.equal(dates.adToBs({ year: 2023, month: 2, day: 29 }), null);
  assert.equal(dates.isValidAd({ year: 2024, month: 2, day: 30 }), false);
  assert.equal(dates.isValidAd({ year: 2024, month: 13, day: 1 }), false);
  assert.equal(dates.isValidAd({ year: 1943, month: 4, day: 13 }), false);
  assert.equal(dates.isValidAd({ year: 2034, month: 4, day: 14 }), false);
  assert.equal(dates.isValidAd({ year: 2024, month: 2, day: 29 }), true);
});

test('the supported range starts and ends exactly where the table does', () => {
  assert.deepEqual(dates.bsToAd({ year: 2000, month: 1, day: 1 }), { year: 1943, month: 4, day: 14 });
  assert.deepEqual(dates.adToBs({ year: 1943, month: 4, day: 14 }), { year: 2000, month: 1, day: 1 });
  assert.deepEqual(dates.bsToAd({ year: 2090, month: 12, day: 30 }), { year: 2034, month: 4, day: 13 });
  assert.deepEqual(dates.adToBs({ year: 2034, month: 4, day: 13 }), { year: 2090, month: 12, day: 30 });
  assert.equal(dates.adToBs({ year: 1943, month: 4, day: 13 }), null);
  assert.equal(dates.adToBs({ year: 2034, month: 4, day: 14 }), null);
});

test('month and year boundaries hold', () => {
  for (const year of [2079, 2080, 2081, 2082, 2083]) {
    const months = dates.bsMonthDays(year);
    for (let m = 1; m <= 12; m++) {
      const last = months[m - 1];
      const adFirst = dates.bsToAd({ year, month: m, day: 1 });
      const adLast = dates.bsToAd({ year, month: m, day: last });
      assert.ok(adFirst && adLast, `${year}-${m}`);
      /* the day after the last day is the first day of the next month */
      const next = dates.adToBs({ year: adLast.year, month: adLast.month, day: adLast.day + 1 });
      if (next) {
        const nextAd = dates.bsToAd(next);
        assert.equal(nextAd.year, adLast.year);
        assert.equal(nextAd.month, adLast.month);
        assert.equal(nextAd.day, adLast.day + 1);
      }
    }
  }
});

test('every day of a supported decade round-trips in both directions', () => {
  let count = 0;
  for (let year = 2070; year <= 2085; year++) {
    for (let month = 1; month <= 12; month++) {
      const days = dates.bsMonthDays(year)[month - 1];
      for (let day = 1; day <= days; day++) {
        const ad = dates.bsToAd({ year, month, day });
        const back = dates.adToBs(ad);
        assert.deepEqual(back, { year, month, day }, `${year}-${month}-${day}`);
        count++;
      }
    }
  }
  assert.ok(count > 5800, `${count} dates checked`);
});

test('weekday comes from the Gregorian date, not from the BS components', () => {
  for (const bs of [
    { year: 2079, month: 1, day: 1 },
    { year: 2080, month: 11, day: 18 },
    { year: 2083, month: 7, day: 8 },
    { year: 2060, month: 9, day: 15 },
  ]) {
    const ad = dates.bsToAd(bs);
    const expected = new Date(Date.UTC(ad.year, ad.month - 1, ad.day)).getUTCDay();
    assert.equal(dates.weekdayOf(ad), expected, `${bs.year}-${bs.month}-${bs.day}`);
  }
});

test('manual entry parsing accepts the documented format', () => {
  assert.deepEqual(dates.parseBsDate('2083.06.31'), { ok: true, date: { year: 2083, month: 6, day: 31 } });
  assert.deepEqual(dates.parseBsDate('2083-6-31'), { ok: true, date: { year: 2083, month: 6, day: 31 } });
  assert.deepEqual(dates.parseBsDate('2083/06/31'), { ok: true, date: { year: 2083, month: 6, day: 31 } });
  assert.deepEqual(dates.parseBsDate(' 2083 . 06 . 31 '), { ok: true, date: { year: 2083, month: 6, day: 31 } });
  assert.deepEqual(dates.parseBsDate('२०८३।०६।३१'.replace(/।/g, '.')),
    { ok: true, date: { year: 2083, month: 6, day: 31 } });
  assert.deepEqual(dates.parseAdDate('2024.03.01'), { ok: true, date: { year: 2024, month: 3, day: 1 } });
});

test('manual entry parsing reports why it failed', () => {
  assert.deepEqual(dates.parseBsDate(''), { ok: false, code: 'empty' });
  assert.deepEqual(dates.parseBsDate('   '), { ok: false, code: 'empty' });
  assert.equal(dates.parseBsDate('2083').code, 'incomplete');
  assert.equal(dates.parseBsDate('2083.06').code, 'incomplete');
  assert.equal(dates.parseBsDate('2083.06.31.12').code, 'format');
  assert.equal(dates.parseBsDate('31.06.2083').code, 'format');
  assert.equal(dates.parseBsDate('2083-06.31').code, 'format');
  assert.equal(dates.parseBsDate('abcd.ef.gh').code, 'format');
  assert.equal(dates.parseBsDate('2083.13.01').code, 'month');
  assert.equal(dates.parseBsDate('2083.02.32').code, 'day');
  assert.equal(dates.parseBsDate('1999.12.30').code, 'range');
  assert.equal(dates.parseAdDate('2024.02.30').code, 'day');
  assert.equal(dates.parseAdDate('1943.04.13').code, 'range');
});

test('formatting helpers', () => {
  const bs = { year: 2080, month: 11, day: 18 };
  const ad = { year: 2024, month: 3, day: 1 };
  assert.equal(dates.formatBs(bs), '2080-11-18');
  assert.equal(dates.formatBs(bs, '.'), '2080.11.18');
  assert.equal(dates.formatAd(ad), '2024-03-01');
  assert.equal(dates.formatAd(ad, '.'), '2024.03.01');
  assert.equal(dates.bsLongDate(bs), 'Falgun 18, 2080');
  assert.equal(dates.bsLongDateNp(bs), 'फाल्गुन १८, २०८०');
  assert.equal(dates.toNepaliDigits('2080-11-18'), '२०८०-११-१८');
  assert.equal(dates.monthName(1), 'Baisakh');
  assert.equal(dates.monthNameNp(12), 'चैत');
});
