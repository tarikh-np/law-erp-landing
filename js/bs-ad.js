/* ==========================================================================
   Tarikh — Bikram Sambat ↔ Gregorian conversion engine

   Bikram Sambat month lengths are published for each year by the Nepal Calendar
   Determination Committee; they are not a formula, so this engine needs the real
   table. The table below is the widely used community dataset covering BS 2000 to
   2090 (AD 1943 to 2034), from the MIT licensed nepali-date-converter package
   (© 2020 Subesh Bhandari). Only the month lengths are used.

   Day arithmetic is done in whole days on the proleptic Gregorian calendar, never
   through local time, so a date entered at 00:00 in Kathmandu converts exactly
   like the same date entered at noon anywhere else. JavaScript's Date is not used
   as a calendar, only the millisecond-free day-number formulas below.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarikhDates = factory(); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* Days in each BS month, Baisakh first. Index 0 is BS 2000. */
  var BS_MONTH_DAYS = {
    2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
    2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
    2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
    2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
    2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
  };

  var BS_FIRST_YEAR = 2000;
  var BS_LAST_YEAR = 2090;

  /* BS 2000-01-01 is 14 April 1943. */
  var AD_EPOCH_DAYS = daysFromCivil(1943, 4, 14);

  var MONTH_EN = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  var MONTH_NP = ['\u092c\u0948\u0936\u093e\u0916', '\u091c\u0947\u0920', '\u0905\u0938\u093e\u0930', '\u0936\u094d\u0930\u093e\u0935\u0923', '\u092d\u0926\u094c', '\u0905\u0938\u094b\u091c',
    '\u0915\u093e\u0930\u094d\u0924\u093f\u0915', '\u092e\u0902\u0938\u093f\u0930', '\u092a\u0941\u0937', '\u092e\u093e\u0918', '\u092b\u093e\u0932\u094d\u0917\u0941\u0928', '\u091a\u0948\u0924'];

  /* Sunday first, matching the legal convention below. */
  var WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WEEKDAY_NP = ['\u0906\u0907\u0924\u092c\u093e\u0930', '\u0938\u094b\u092e\u092c\u093e\u0930', '\u092e\u0902\u0917\u0932\u092c\u093e\u0930', '\u092c\u0941\u0927\u092c\u093e\u0930', '\u092c\u093f\u0939\u0940\u092c\u093e\u0930', '\u0936\u0941\u0915\u094d\u0930\u092c\u093e\u0930', '\u0936\u0928\u093f\u092c\u093e\u0930'];

  /* Legal documents number the days 1 (Sunday) to 6 (Friday). Saturday has no
     number in that convention; do not invent one. */
  var LEGAL_DAY_NUMBER = [1, 2, 3, 4, 5, 6, null];

  var NEPALI_DIGITS = ['\u0966', '\u0967', '\u0968', '\u0969', '\u096a', '\u096b', '\u096c', '\u096d', '\u096e', '\u096f'];

  /* ---------------------------------------------------------------------------
     Day arithmetic (Howard Hinnant's civil-from-days algorithms)
     --------------------------------------------------------------------------- */

  function daysFromCivil(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  function civilFromDays(z) {
    z += 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400;
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    return { year: y + (m <= 2 ? 1 : 0), month: m, day: d };
  }

  function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  function adMonthDays(y, m) {
    return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  }

  /* ---------------------------------------------------------------------------
     Calendar data
     --------------------------------------------------------------------------- */

  function bsMonthDays(year) {
    return BS_MONTH_DAYS[year] || null;
  }

  function bsYearDays(year) {
    var months = bsMonthDays(year);
    if (!months) return 0;
    var total = 0;
    for (var i = 0; i < 12; i++) total += months[i];
    return total;
  }

  var yearStart = {};   // BS year -> days since the BS epoch
  var running = 0;
  for (var y = BS_FIRST_YEAR; y <= BS_LAST_YEAR; y++) {
    yearStart[y] = running;
    running += bsYearDays(y);
  }
  var BS_TOTAL_DAYS = running;

  var AD_END_DAYS = AD_EPOCH_DAYS + BS_TOTAL_DAYS - 1;

  function isSupportedBsYear(year) {
    return year >= BS_FIRST_YEAR && year <= BS_LAST_YEAR;
  }

  function isValidBs(date) {
    if (!date || !isSupportedBsYear(date.year)) return false;
    if (date.month < 1 || date.month > 12) return false;
    var months = bsMonthDays(date.year);
    return date.day >= 1 && date.day <= months[date.month - 1];
  }

  function isValidAd(date) {
    if (!date) return false;
    if (date.month < 1 || date.month > 12) return false;
    if (date.day < 1 || date.day > adMonthDays(date.year, date.month)) return false;
    var days = daysFromCivil(date.year, date.month, date.day);
    return days >= AD_EPOCH_DAYS && days <= AD_END_DAYS;
  }

  /* BS -> AD. Returns null when the BS date does not exist. */
  function bsToAd(bs) {
    if (!isValidBs(bs)) return null;
    var offset = yearStart[bs.year];
    var months = bsMonthDays(bs.year);
    for (var i = 0; i < bs.month - 1; i++) offset += months[i];
    offset += bs.day - 1;
    return civilFromDays(AD_EPOCH_DAYS + offset);
  }

  /* AD -> BS. Returns null outside the supported BS range. */
  function adToBs(ad) {
    if (!isValidAd(ad)) return null;
    var days = daysFromCivil(ad.year, ad.month, ad.day) - AD_EPOCH_DAYS;
    var year = BS_FIRST_YEAR;
    while (year <= BS_LAST_YEAR) {
      var length = bsYearDays(year);
      if (days < length) break;
      days -= length;
      year++;
    }
    if (year > BS_LAST_YEAR) return null;
    var months = bsMonthDays(year);
    var month = 1;
    while (month <= 12 && days >= months[month - 1]) {
      days -= months[month - 1];
      month++;
    }
    return { year: year, month: month, day: days + 1 };
  }

  /* ---------------------------------------------------------------------------
     Weekday and the legal day number
     --------------------------------------------------------------------------- */

  /* 0 = Sunday … 6 = Saturday, from the Gregorian date itself. */
  function weekdayOf(ad) {
    var days = daysFromCivil(ad.year, ad.month, ad.day);
    return ((days + 4) % 7 + 7) % 7;
  }

  function legalDayNumber(weekdayIndex) {
    if (weekdayIndex < 0 || weekdayIndex > 6) return null;
    return LEGAL_DAY_NUMBER[weekdayIndex];
  }

  /* ---------------------------------------------------------------------------
     Formatting
     --------------------------------------------------------------------------- */

  function pad(n, width) {
    var s = String(n);
    while (s.length < (width || 2)) s = '0' + s;
    return s;
  }

  function toNepaliDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) { return NEPALI_DIGITS[Number(d)]; });
  }

  function formatBs(bs, separator) {
    var sep = separator || '-';
    return bs.year + sep + pad(bs.month) + sep + pad(bs.day);
  }

  function formatAd(ad, separator) {
    var sep = separator || '-';
    return ad.year + sep + pad(ad.month) + sep + pad(ad.day);
  }

  /* "Falgun 18, 2080" — the BS month name, not a transliterated number. */
  function bsLongDate(bs) {
    return MONTH_EN[bs.month - 1] + ' ' + bs.day + ', ' + bs.year;
  }

  function bsLongDateNp(bs) {
    return MONTH_NP[bs.month - 1] + ' ' + toNepaliDigits(bs.day) + ', ' + toNepaliDigits(bs.year);
  }

  /* The line Nepali legal documents use: 2080 saal 11 mahina 18 gatey 6 roj. */
  function legalDateLine(bs, weekdayIndex) {
    var n = legalDayNumber(weekdayIndex);
    if (n === null) return null;
    return bs.year + ' saal ' + pad(bs.month) + ' mahina ' + pad(bs.day) +
      ' gatey ' + n + ' roj';
  }

  /* ---------------------------------------------------------------------------
     Parsing — manual entry, no dropdowns
     --------------------------------------------------------------------------- */

  var DIGIT_MAP = { '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096a': '4', '\u096b': '5', '\u096c': '6', '\u096d': '7', '\u096e': '8', '\u096f': '9' };

  function normalizeDigits(text) {
    return String(text).replace(/[\u0966-\u096f]/g, function (d) { return DIGIT_MAP[d]; });
  }

  /* Accepts 2083.06.31, 2083-6-31, 2083/06/31 and the same with spaces. The
     separator may be repeated consistently; a date is never guessed. */
  function parseNumericDate(input, minYear, maxYear) {
    var text = normalizeDigits(input).trim();
    if (!text) return { ok: false, code: 'empty' };
    var match = /^(\d{1,4})\s*([.\-\/])\s*(\d{1,2})\s*\2\s*(\d{1,2})$/.exec(text);
    if (!match) {
      // A year on its own, or a year and a month, is a half-typed date, not garbage.
      if (/^\d{1,4}$/.test(text) || /^\d{1,4}\s*[.\-/]\s*\d{1,2}$/.test(text)) {
        return { ok: false, code: 'incomplete' };
      }
      return { ok: false, code: 'format' };
    }
    var date = { year: Number(match[1]), month: Number(match[3]), day: Number(match[4]) };
    if (date.year < minYear || date.year > maxYear) return { ok: false, code: 'range', date: date };
    return { ok: true, date: date };
  }

  function parseBsDate(input) {
    var parsed = parseNumericDate(input, BS_FIRST_YEAR, BS_LAST_YEAR);
    if (!parsed.ok) return parsed;
    if (parsed.date.month < 1 || parsed.date.month > 12) return { ok: false, code: 'month', date: parsed.date };
    var days = bsMonthDays(parsed.date.year)[parsed.date.month - 1];
    if (parsed.date.day < 1 || parsed.date.day > days) {
      return { ok: false, code: 'day', date: parsed.date, maxDay: days };
    }
    return parsed;
  }

  function parseAdDate(input) {
    var parsed = parseNumericDate(input, 1000, 9999);
    if (!parsed.ok) return parsed;
    if (parsed.date.month < 1 || parsed.date.month > 12) return { ok: false, code: 'month', date: parsed.date };
    var days = adMonthDays(parsed.date.year, parsed.date.month);
    if (parsed.date.day < 1 || parsed.date.day > days) {
      return { ok: false, code: 'day', date: parsed.date, maxDay: days };
    }
    if (!isValidAd(parsed.date)) return { ok: false, code: 'range', date: parsed.date };
    return parsed;
  }

  return {
    bsMonthDays: bsMonthDays,
    bsYearDays: bsYearDays,
    isValidBs: isValidBs,
    isValidAd: isValidAd,
    bsToAd: bsToAd,
    adToBs: adToBs,
    weekdayOf: weekdayOf,
    legalDayNumber: legalDayNumber,
    formatBs: formatBs,
    formatAd: formatAd,
    bsLongDate: bsLongDate,
    bsLongDateNp: bsLongDateNp,
    legalDateLine: legalDateLine,
    parseBsDate: parseBsDate,
    parseAdDate: parseAdDate,
    toNepaliDigits: toNepaliDigits,
    monthName: function (m) { return MONTH_EN[m - 1]; },
    monthNameNp: function (m) { return MONTH_NP[m - 1]; },
    weekdayName: function (i) { return WEEKDAY_EN[i]; },
    weekdayNameNp: function (i) { return WEEKDAY_NP[i]; },
    range: {
      bs: {
        first: { year: BS_FIRST_YEAR, month: 1, day: 1 },
        last: { year: BS_LAST_YEAR, month: 12, day: bsMonthDays(BS_LAST_YEAR)[11] }
      },
      ad: { first: civilFromDays(AD_EPOCH_DAYS), last: civilFromDays(AD_END_DAYS) }
    },
    months: { en: MONTH_EN, np: MONTH_NP },
    weekdays: { en: WEEKDAY_EN, np: WEEKDAY_NP, legal: LEGAL_DAY_NUMBER }
  };
}));
