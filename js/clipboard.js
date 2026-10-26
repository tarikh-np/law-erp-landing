/* ==========================================================================
   Tarikh — clipboard helper for the public tools
   One copy path with a fallback for browsers that block the async clipboard,
   plus the "Copied" state both tools use.
   ========================================================================== */
(function (root) {
  'use strict';

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copy(text) {
    if (!text) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function flash(button, label) {
    if (!button) return;
    var original = button.getAttribute('data-label') || button.textContent;
    button.setAttribute('data-label', original);
    button.textContent = label || 'Copied';
    button.classList.add('is-done');
    window.clearTimeout(button._flashTimer);
    button._flashTimer = window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove('is-done');
    }, 1800);
  }

  root.TarikhClipboard = { copy: copy, flash: flash };
}(window));
