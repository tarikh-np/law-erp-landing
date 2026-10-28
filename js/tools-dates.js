/* ==========================================================================
   Tarikh — BS ⇄ AD date tool controller

   All calendar logic lives in js/bs-ad.js. This file reads the field, renders
   the slip, and keeps the copy actions and the error messages in step.
   ========================================================================== */
(function () {
  'use strict';

  var dates = window.TarikhDates;
  var clipboard = window.TarikhClipboard;
  if (!dates) return;

  var form = document.getElementById('dateForm');
  if (!form) return;

  var input = document.getElementById('dateInput');
  var label = document.getElementById('dateLabel');
  var hint = document.getElementById('dateHint');
  var errorBox = document.getElementById('dateError');
  var slip = document.getElementById('slip');
  var slipEmpty = document.getElementById('slipEmpty');
  var slipExtra = document.getElementById('slipExtra');
  var slipOrder = document.getElementById('slipOrder');
  var fieldBs = document.getElementById('slipBs');
  var fieldBsLong = document.getElementById('slipBsLong');
  var fieldAd = document.getElementById('slipAd');
  var fieldDay = document.getElementById('slipDay');
  var fieldLegal = document.getElementById('slipLegal');
  var stamp = document.getElementById('slipStamp');
  var stampNum = document.getElementById('slipStampNum');
  var stampLabel = document.getElementById('slipStampLabel');
  var resetBtn = document.getElementById('resetBtn');
  var segButtons = Array.prototype.slice.call(document.querySelectorAll('.tool-bar .seg-btn'));

  var MODES = {
    'bs-to-ad': {
      label: 'Bikram Sambat date',
      placeholder: '2083.06.31',
      hint: 'Year, month, day. Any separator works: <code>2083.06.31</code>, <code>2083-06-31</code>, <code>2083/06/31</code>.',
      example: '2083.06.31',
      order: 'BS \u2192 AD'
    },
    'ad-to-bs': {
      label: 'Gregorian date',
      placeholder: '2026.10.17',
      hint: 'Year, month, day. Any separator works: <code>2026.10.17</code>, <code>2026-10-17</code>, <code>2026/10/17</code>.',
      example: '2026.10.17',
      order: 'AD \u2192 BS'
    }
  };

  var direction = 'bs-to-ad';
  var state = null;

  function setMode(next) {
    direction = next;
    var mode = MODES[direction];
    label.textContent = mode.label;
    input.placeholder = mode.placeholder;
    hint.innerHTML = mode.hint;
    slipOrder.textContent = mode.order;
    segButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-direction') === direction ? 'true' : 'false');
    });
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function failure(parsed) {
    var mode = MODES[direction];
    if (parsed.code === 'empty') return 'Enter a date to convert.';
    if (parsed.code === 'incomplete') return 'Add the month and day. The full format is ' + mode.example + '.';
    if (parsed.code === 'format') return 'Use year, month and day with the same separator, for example ' + mode.example + '.';
    if (parsed.code === 'month') return 'The month has to be between 1 and 12.';
    if (parsed.code === 'day') {
      var day = parsed.date.day;
      var name = direction === 'bs-to-ad'
        ? dates.monthName(parsed.date.month) + ' ' + parsed.date.year
        : new Date(Date.UTC(parsed.date.year, parsed.date.month - 1, 1)).toLocaleString('en-US', { month: 'long' }) + ' ' + parsed.date.year;
      return name + ' has ' + parsed.maxDay + ' days, so day ' + day + ' does not exist.';
    }
    if (direction === 'bs-to-ad') return 'This converter covers BS 2000 to 2090. Try a year inside that range.';
    return 'This converter covers AD 1943 to 2034. Try a year inside that range.';
  }

  function combinedDate(bs, ad) {
    return dates.formatBs(bs, '.') + ' - ' + dates.formatAd(ad, '.');
  }

  function nepaliLegalLine(bs, n) {
    return dates.toNepaliDigits(bs.year) + ' साल ' + dates.toNepaliDigits(bs.month) +
      ' महिना ' + dates.toNepaliDigits(bs.day) + ' गते ' + dates.toNepaliDigits(n) + ' रोज';
  }

  function setCopyEnabled(name, enabled) {
    var button = slip.querySelector('[data-copy="' + name + '"]') || slipExtra.querySelector('[data-copy="' + name + '"]');
    if (button) button.disabled = !enabled;
  }

  function render(result) {
    state = result;

    fieldBs.textContent = dates.formatBs(result.bs);
    fieldBsLong.textContent = dates.bsLongDate(result.bs) + ' · ' + dates.bsLongDateNp(result.bs);
    fieldAd.textContent = dates.formatAd(result.ad);
    fieldDay.textContent = dates.weekdayName(result.weekday) + ' · ' + dates.weekdayNameNp(result.weekday);

    if (result.legalLine) {
      fieldLegal.textContent = result.legalLine;
      fieldLegal.classList.remove('slip-code--none');
      stamp.classList.remove('stamp--none');
      stampNum.textContent = String(result.legalNumber);
      stampLabel.textContent = 'roj';
    } else {
      fieldLegal.textContent = 'Saturday — no number defined in the current legal convention.';
      fieldLegal.classList.add('slip-code--none');
      stamp.classList.add('stamp--none');
      stampNum.textContent = '—';
      stampLabel.textContent = 'roj';
    }

    document.getElementById('copyBsDots').textContent = 'Copy ' + dates.formatBs(result.bs, '.');
    slip.hidden = false;
    slipEmpty.hidden = true;
    slipExtra.hidden = false;

    setCopyEnabled('legal', Boolean(result.legalLine));
    setCopyEnabled('legalNp', Boolean(result.legalLine));
  }

  function resetSlip() {
    state = null;
    slip.hidden = true;
    slipEmpty.hidden = false;
    slipExtra.hidden = true;
  }

  function convert() {
    var raw = input.value;
    var parsed = direction === 'bs-to-ad' ? dates.parseBsDate(raw) : dates.parseAdDate(raw);

    if (!parsed.ok) {
      clearError();
      showError(failure(parsed));
      resetSlip();
      return;
    }

    var bs;
    var ad;
    if (direction === 'bs-to-ad') {
      bs = parsed.date;
      ad = dates.bsToAd(bs);
    } else {
      ad = parsed.date;
      bs = dates.adToBs(ad);
    }

    if (!bs || !ad) {
      clearError();
      showError(direction === 'bs-to-ad'
        ? 'That date is outside the BS 2000–2090 range this converter holds.'
        : 'That date is outside the AD 1943–2034 range this converter holds.');
      resetSlip();
      return;
    }

    var weekday = dates.weekdayOf(ad);
    clearError();
    render({
      bs: bs,
      ad: ad,
      weekday: weekday,
      legalNumber: dates.legalDayNumber(weekday),
      legalLine: dates.legalDateLine(bs, weekday)
    });
  }

  function copyValue(kind, button) {
    if (!state) return;
    var value = null;
    if (kind === 'bs') value = dates.formatBs(state.bs);
    if (kind === 'ad') value = dates.formatAd(state.ad);
    if (kind === 'bsDots') value = dates.formatBs(state.bs, '.');
    if (kind === 'combined') value = combinedDate(state.bs, state.ad);
    if (kind === 'legal') value = state.legalLine;
    if (kind === 'legalNp') value = nepaliLegalLine(state.bs, state.legalNumber);
    if (!value) return;

    clipboard.copy(value).then(function (ok) {
      if (ok) clipboard.flash(button, 'Copied');
      else showError('The browser blocked copying. Select the date and press Ctrl+C (⌘C on Mac).');
    });
  }

  segButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-direction');
      if (next === direction) return;
      var previous = state;
      setMode(next);
      clearError();
      if (previous) {
        // Carry the converted date across so the reverse direction is one click away.
        input.value = next === 'bs-to-ad'
          ? dates.formatBs(previous.bs, '.')
          : dates.formatAd(previous.ad, '.');
        convert();
      } else {
        resetSlip();
        input.focus();
      }
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    convert();
  });

  input.addEventListener('input', function () {
    if (!errorBox.hidden) clearError();
  });

  resetBtn.addEventListener('click', function () {
    input.value = '';
    clearError();
    resetSlip();
    input.focus();
  });

  slip.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (button) copyValue(button.getAttribute('data-copy'), button);
  });

  slipExtra.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (button) copyValue(button.getAttribute('data-copy'), button);
  });

  // Open on today's date so the tool shows a real result immediately.
  (function prefillToday() {
    var now = new Date();
    var ad = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    var bs = dates.adToBs(ad);
    setMode('bs-to-ad');
    if (bs) {
      input.value = dates.formatBs(bs, '.');
      convert();
    }
  }());
}());
