/* ==========================================================================
   Tarikh — Preeti ⇄ Unicode tool controller

   Keeps the engine and the page apart: this file moves text, switches direction,
   runs the document upload, and reports what the engine says. Conversion is
   live: the output follows the input as it is typed or pasted. Nothing here
   touches the network or storage — a .docx is read and rewritten in this tab.
   ========================================================================== */
(function () {
  'use strict';

  var engine = window.TarikhPreeti;
  var clipboard = window.TarikhClipboard;
  if (!engine) return;

  var shell = document.querySelector('.tool-shell');
  if (!shell) return;

  var source = document.getElementById('sourceText');
  var output = document.getElementById('outputText');
  var sourceLabel = document.getElementById('sourceLabel');
  var outputLabel = document.getElementById('outputLabel');
  var sourceHint = document.getElementById('sourceHint');
  var outputHint = document.getElementById('outputHint');
  var sourceCount = document.getElementById('sourceCount');
  var outputCount = document.getElementById('outputCount');
  var status = document.getElementById('status');
  var alertBox = document.getElementById('alert');
  var copyBtn = document.getElementById('copyBtn');
  var swapBtn = document.getElementById('swapBtn');
  var pasteBtn = document.getElementById('pasteBtn');
  var clearBtn = document.getElementById('clearBtn');
  var segButtons = Array.prototype.slice.call(shell.querySelectorAll('.seg-btn'));

  var MODES = {
    'to-unicode': {
      sourceLabel: 'Preeti input',
      outputLabel: 'Nepali Unicode result',
      sourceHint: 'Type with the Preeti keyboard layout. The Nepali Unicode result appears at right.',
      outputHint: 'Converted text appears here as you type.',
      placeholder: 'Paste Preeti text or a legal document here, for example:\n\ng]kfnL cbfntdf k]zL k/Lsf sfo{ .',
      outputPlaceholder: 'Nepali Unicode appears here. You can edit it before copying.',
      sourceIsPreeti: true
    },
    'to-preeti': {
      sourceLabel: 'Unicode input',
      outputLabel: 'Preeti output',
      sourceHint: 'Type or paste Nepali Unicode text here.',
      outputHint: 'This Preeti text uses the Preeti font installed on your device.',
      placeholder: 'Paste Nepali Unicode text or a legal document here, for example:\n\nनेपाली अदालतमा पेशी परेको कार्य ।',
      outputPlaceholder: 'The Preeti-encoded text appears here as you type. Set it in a Preeti font to read it.',
      sourceIsPreeti: false
    }
  };

  var direction = 'to-unicode';
  var lastRun = { text: null, direction: null };
  var convertTimer = 0;
  var alertTimer = 0;
  var outputEdited = false;

  /* Short text converts in a frame, which feels immediate. A long pleading is
     debounced just enough that a fast typist never queues a whole document per
     keystroke; 120 ms still reads as "as you type". */
  var LIVE_LIMIT = 20000;
  var LIVE_DELAY = 120;
  var ALERT_DELAY = 700;

  function countLabel(value) {
    var n = value.length;
    return n.toLocaleString('en-US') + (n === 1 ? ' character' : ' characters');
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function clearAlert() {
    alertBox.hidden = true;
    alertBox.textContent = '';
    alertBox.className = 'tool-alert';
  }

  function showAlert(message, kind) {
    alertBox.hidden = false;
    alertBox.className = 'tool-alert' + (kind ? ' tool-alert--' + kind : '');
    alertBox.textContent = message;
  }

  function describeChars(list) {
    return list.slice(0, 8).map(function (item) {
      return item.char;
    }).join(' ');
  }

  /* The engine counts the keys its rules consume (reph "{" and the m suffix) as
     unmapped because they are not in the glyph table. Only characters still in
     the output are actually left behind, so the message names those. */
  function leftovers(list, text) {
    return list.filter(function (item) {
      return text.indexOf(item.char) !== -1;
    });
  }

  function updateCounts() {
    sourceCount.textContent = countLabel(source.value);
    outputCount.textContent = countLabel(output.value);
    copyBtn.disabled = output.value.length === 0;
  }

  function applyMode() {
    var mode = MODES[direction];
    sourceLabel.textContent = mode.sourceLabel;
    outputLabel.textContent = mode.outputLabel;
    sourceHint.textContent = mode.sourceHint;
    outputHint.textContent = mode.outputHint;
    source.placeholder = mode.placeholder;
    output.placeholder = mode.outputPlaceholder;
    source.classList.toggle('tool-field--preeti', mode.sourceIsPreeti);
    output.classList.toggle('tool-field--preeti', !mode.sourceIsPreeti);
    segButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-direction') === direction ? 'true' : 'false');
    });
  }

  function report(result, withAlerts) {
    var stats = result.stats;
    if (!result.text) {
      setStatus('Nothing to convert.');
      return;
    }
    setStatus('Converted ' + stats.charsIn.toLocaleString('en-US') + ' characters into ' +
      stats.charsOut.toLocaleString('en-US') + ' · ' + stats.lines +
      (stats.lines === 1 ? ' line' : ' lines'));

    if (!withAlerts) return;

    if (stats.wrongDirection) {
      showAlert('This looks like Nepali Unicode already. Choose “Unicode → Preeti” to convert it the other way.', 'info');
      return;
    }
    var unmapped = leftovers(stats.unmapped, result.text);
    var passthrough = leftovers(stats.passthrough, result.text);
    if (unmapped.length) {
      var total = unmapped.reduce(function (sum, item) { return sum + item.count; }, 0);
      var message = total + (total === 1 ? ' character is' : ' characters are') +
        ' not part of this encoding and ' + (total === 1 ? 'was' : 'were') +
        ' left unchanged: ' + describeChars(unmapped);
      showAlert(message, 'info');
      return;
    }
    if (passthrough.length) {
      var kept = passthrough.reduce(function (sum, item) { return sum + item.count; }, 0);
      showAlert(kept + (kept === 1 ? ' character has' : ' characters have') +
        ' no Preeti key and ' + (kept === 1 ? 'was' : 'were') +
        ' left as typed: ' + describeChars(passthrough) +
        '. Check those in Word before printing.', 'info');
    }
  }

  /* Alerts wait for a pause in typing, so a message never flickers mid-word. */
  function scheduleAlerts(result) {
    window.clearTimeout(alertTimer);
    alertTimer = window.setTimeout(function () {
      report(result, true);
    }, ALERT_DELAY);
  }

  function convertNow() {
    window.clearTimeout(convertTimer);
    convertTimer = 0;

    var text = source.value;
    if (text === lastRun.text && direction === lastRun.direction) {
      updateCounts();
      return;
    }
    lastRun = { text: text, direction: direction };

    if (!text) {
      output.value = '';
      clearAlert();
      updateCounts();
      setStatus('Add some text to convert.');
      return;
    }

    var result;
    try {
      result = direction === 'to-unicode' ? engine.toUnicode(text) : engine.toPreeti(text);
    } catch (error) {
      output.value = '';
      updateCounts();
      showAlert('This text could not be converted. Undo the last edit and try again.', 'error');
      setStatus('Conversion failed.');
      return;
    }

    output.value = result.text;
    outputEdited = false;
    updateCounts();
    report(result, false);
    scheduleAlerts(result);
  }

  function scheduleConvert() {
    window.clearTimeout(convertTimer);
    if (source.value.length <= LIVE_LIMIT) {
      convertTimer = window.setTimeout(convertNow, 16);
    } else {
      convertTimer = window.setTimeout(convertNow, LIVE_DELAY);
    }
  }

  function setDirection(next) {
    if (next === direction) return;
    var carried = output.value;
    direction = next;
    lastRun = { text: null, direction: null };
    applyMode();

    if (carried) {
      source.value = carried;
      output.value = '';
      updateCounts();
      convertNow();
    } else {
      clearAlert();
      updateCounts();
      setStatus('Direction changed. Text converts as you type.');
      convertNow();
    }
    source.focus();
  }

  function copyOutput() {
    if (!output.value) {
      setStatus('Nothing to copy yet.');
      return;
    }
    clipboard.copy(output.value).then(function (ok) {
      if (ok) {
        clipboard.flash(copyBtn, 'Copied');
        setStatus('Output copied to the clipboard.');
      } else {
        showAlert('The browser blocked copying. Select the text and press Ctrl+C (⌘C on Mac).', 'error');
      }
    });
  }

  function pasteInput() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      showAlert('This browser does not allow pasting from a button. Click the input and press Ctrl+V (⌘V on Mac).', 'info');
      source.focus();
      return;
    }
    navigator.clipboard.readText().then(function (text) {
      if (!text) {
        setStatus('The clipboard is empty.');
        return;
      }
      source.value = text;
      updateCounts();
      clearAlert();
      convertNow();
    }).catch(function () {
      showAlert('Pasting was blocked. Click the input and press Ctrl+V (⌘V on Mac).', 'info');
      source.focus();
    });
  }

  function clearAll() {
    source.value = '';
    output.value = '';
    outputEdited = false;
    lastRun = { text: '', direction: direction };
    clearAlert();
    updateCounts();
    setStatus('Cleared.');
    source.focus();
  }

  segButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setDirection(button.getAttribute('data-direction'));
    });
  });

  copyBtn.addEventListener('click', copyOutput);
  pasteBtn.addEventListener('click', pasteInput);
  clearBtn.addEventListener('click', clearAll);
  swapBtn.addEventListener('click', function () {
    setDirection(direction === 'to-unicode' ? 'to-preeti' : 'to-unicode');
  });

  source.addEventListener('input', function () {
    updateCounts();
    if (!alertBox.hidden) clearAlert();
    window.clearTimeout(alertTimer);
    scheduleConvert();
  });

  /* Editing the output is allowed and never feeds back into the output: only the
     input schedules a conversion. The note is announced once per edit, not on
     every keystroke. */
  output.addEventListener('input', function () {
    updateCounts();
    if (outputEdited) return;
    outputEdited = true;
    setStatus('Output edited. It changes again when you edit the input.');
  });

  applyMode();
  updateCounts();
  setStatus('Ready. Type or paste text to convert.');

  /* --------------------------------------------------------------------------
     Document upload: Preeti .docx in, Unicode .docx out, in this tab.
     -------------------------------------------------------------------------- */
  var docx = window.TarikhDocx;
  var docInput = document.getElementById('docFile');
  if (!docx || !docInput) return;

  var docDrop = document.getElementById('docDrop');
  var docInfo = document.getElementById('docFileInfo');
  var docName = document.getElementById('docFileName');
  var docMeta = document.getElementById('docFileMeta');
  var docMode = document.getElementById('docMode');
  var docConvert = document.getElementById('docConvert');
  var docDownload = document.getElementById('docDownload');
  var docStatus = document.getElementById('docStatus');
  var docAlert = document.getElementById('docAlert');
  var docRemove = document.getElementById('docRemove');

  var selectedFile = null;
  var downloadUrl = '';
  var busy = false;

  function setDocStatus(message) {
    docStatus.textContent = message;
  }

  function clearDocAlert() {
    docAlert.hidden = true;
    docAlert.textContent = '';
    docAlert.className = 'tool-alert';
  }

  function showDocAlert(message, kind) {
    docAlert.hidden = false;
    docAlert.className = 'tool-alert' + (kind ? ' tool-alert--' + kind : '');
    docAlert.textContent = message;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function outputName(name) {
    return name.replace(/\.docx$/i, '') + '-unicode.docx';
  }

  function resetResult() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = '';
    }
    docDownload.hidden = true;
    docDownload.removeAttribute('href');
    docDownload.className = 'btn btn--ghost';
    docConvert.className = 'btn btn--primary';
    docConvert.textContent = 'Convert Document';
  }

  function clearFile() {
    resetResult();
    selectedFile = null;
    docInput.value = '';
    docInfo.hidden = true;
    docDrop.classList.remove('has-file');
    docConvert.disabled = true;
    clearDocAlert();
  }

  function chooseFile(file) {
    if (busy || !file) return;
    clearFile();

    if (!/\.docx$/i.test(file.name)) {
      showDocAlert('Only .docx documents can be converted. In Word, choose File → Save As and pick .docx, then upload it here.', 'error');
      setDocStatus('That file type is not supported.');
      return;
    }
    if (!file.size) {
      showDocAlert('That document is empty, so there is nothing to convert.', 'error');
      setDocStatus('No document selected.');
      return;
    }
    if (file.size > docx.maxBytes) {
      showDocAlert('That document is ' + formatBytes(file.size) + '. The limit is ' + formatBytes(docx.maxBytes) +
        '. Split it in Word and convert each part.', 'error');
      setDocStatus('No document selected.');
      return;
    }

    selectedFile = file;
    docName.textContent = file.name;
    docMeta.textContent = formatBytes(file.size) + ' · ready to convert';
    docInfo.hidden = false;
    docDrop.classList.add('has-file');
    docConvert.disabled = false;
    setDocStatus('Ready. The file stays on this device.');
  }

  function describeSuccess(stats, mode) {
    var font = stats.fonts.length === 1 ? ' set in ' + stats.fonts[0] : '';
    var parts = ['Converted ' + stats.paragraphsConverted.toLocaleString('en-US') +
      (stats.paragraphsConverted === 1 ? ' paragraph' : ' paragraphs') + ' (' +
      stats.charsIn.toLocaleString('en-US') + ' characters)' + font + '.'];
    parts.push('Paragraphs, tables, lists, headers and footers kept their layout.');
    if (mode !== 'all') parts.push('Text in other fonts, and Devanagari that was already Unicode, were left as they were.');
    return parts.join(' ');
  }

  function describeWarnings(stats) {
    var notes = [];
    if (stats.wordsMerged) {
      notes.push(stats.wordsMerged + (stats.wordsMerged === 1 ? ' word straddled' : ' words straddled') +
        ' a formatting change and ' + (stats.wordsMerged === 1 ? 'was' : 'were') +
        ' converted whole, so no character was lost. Check those spots for bold or italics.');
    }
    if (stats.segmentsMerged) {
      notes.push(stats.segmentsMerged + (stats.segmentsMerged === 1 ? ' sentence' : ' sentences') +
        ' could not be split across formats without changing a character, so ' +
        (stats.segmentsMerged === 1 ? 'it was' : 'they were') + ' set in a single run.');
    }
    if (stats.unmapped.length) {
      var total = stats.unmapped.reduce(function (sum, item) { return sum + item.count; }, 0);
      notes.push(total + (total === 1 ? ' character has' : ' characters have') +
        ' no Unicode match in the Preeti table and ' + (total === 1 ? 'was' : 'were') +
        ' left as ' + (total === 1 ? 'it was' : 'they were') + ': ' +
        describeChars(stats.unmapped) + '.');
    }
    return notes.join(' ');
  }

  function showResult(file, result) {
    var stats = result.stats;
    var mode = docMode.value;

    if (!stats.runsConverted) {
      showDocAlert(mode === 'all'
        ? 'No Latin text was found in this document, so there was nothing to convert.'
        : 'No text set in a Preeti font was found. If the document is Preeti-encoded but the font name was lost, choose “Every Latin run” above and convert again.', 'info');
      setDocStatus('Nothing was converted. The document is unchanged.');
      return;
    }

    downloadUrl = URL.createObjectURL(result.blob);
    docDownload.href = downloadUrl;
    docDownload.download = outputName(file.name);
    docDownload.hidden = false;
    docDownload.className = 'btn btn--primary';
    docConvert.className = 'btn btn--ghost';
    docConvert.textContent = 'Convert again';

    if (!stats.charsIn) {
      /* Every run was already Devanagari: only the font names had to change. */
      setDocStatus('The Nepali text was already Unicode. Only the font names were corrected — download the document below to keep the change.');
    } else {
      setDocStatus(describeSuccess(stats, mode));
    }
    var warnings = describeWarnings(stats);
    if (warnings) showDocAlert(warnings, 'info');
  }

  function runConversion() {
    if (!selectedFile || busy) return;
    var file = selectedFile;

    busy = true;
    resetResult();
    clearDocAlert();
    docConvert.disabled = true;
    docConvert.classList.add('is-busy');
    docConvert.setAttribute('aria-busy', 'true');
    setDocStatus('Converting on this device…');

    file.arrayBuffer().then(function (buffer) {
      return docx.convertDocument(buffer, { mode: docMode.value });
    }).then(function (result) {
      showResult(file, result);
    }).catch(function (error) {
      showDocAlert(error && error.message
        ? error.message
        : 'This document could not be converted. Open it in Word, save it again as .docx, and retry.', 'error');
      setDocStatus('Conversion failed. The document was not changed.');
    }).then(function () {
      busy = false;
      docConvert.disabled = false;
      docConvert.classList.remove('is-busy');
      docConvert.removeAttribute('aria-busy');
      if (!downloadUrl) docConvert.textContent = 'Convert Document';
    });
  }

  docInput.addEventListener('change', function () {
    chooseFile(docInput.files && docInput.files[0]);
  });

  docConvert.addEventListener('click', runConversion);

  docRemove.addEventListener('click', function () {
    if (busy) return;
    clearFile();
    setDocStatus('No document selected.');
    docInput.focus();
  });

  docMode.addEventListener('change', function () {
    if (!selectedFile || busy) return;
    resetResult();
    clearDocAlert();
    setDocStatus('Ready. The file stays on this device.');
  });

  ['dragenter', 'dragover'].forEach(function (name) {
    docDrop.addEventListener(name, function (event) {
      if (busy) return;
      event.preventDefault();
      docDrop.classList.add('is-drag');
    });
  });

  docDrop.addEventListener('dragleave', function (event) {
    if (!docDrop.contains(event.relatedTarget)) docDrop.classList.remove('is-drag');
  });

  docDrop.addEventListener('drop', function (event) {
    event.preventDefault();
    docDrop.classList.remove('is-drag');
    if (busy) return;
    var files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length) chooseFile(files[0]);
  });

  window.addEventListener('pagehide', function () {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  });

  if (!docx.isSupported()) {
    docConvert.disabled = true;
    showDocAlert('This browser cannot convert .docx files. Use a current version of Chrome, Edge, Firefox or Safari.', 'error');
    setDocStatus('Document conversion is not available here.');
  }
}());
