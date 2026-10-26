/* ==========================================================================
   Tarikh — Preeti document (.docx) conversion

   A .docx is a zip of WordprocessingML parts. This module opens that zip in the
   browser, converts the text inside the <w:t> elements of the parts that carry
   visible text, and re-zips the archive. Every other byte of every part is
   copied through untouched, so styles, tables, numbering, headers, footers,
   page setup, images, hyperlinks and field codes cannot be lost: they are never
   parsed, rebuilt or re-emitted.

   Text is not converted run by run. Word splits a word across runs for reasons
   that have nothing to do with formatting (proofing marks, rsids, editing
   history), so runs are first grouped into convertible segments, each segment
   is converted whole by js/preeti.js, and the result goes back to the runs
   along word boundaries. A bold word Word broke into three runs keeps its
   characters and its bold.

   Nothing here touches the network, storage or a server: the file is read with
   the page's own memory and the result is a Blob the user downloads.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./preeti.js')); }
  else { root.TarikhDocx = factory(root.TarikhPreeti); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  var MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  var MAX_BYTES = 20 * 1024 * 1024;
  var MAX_PART_BYTES = 80 * 1024 * 1024;
  /* The font a converted run is set in, so the new Unicode text is readable in
     Word without the user retyping the font name run by run. */
  var UNICODE_FONT = 'Nirmala UI';

  /* Font names that mean "this text is legacy Preeti text". Word only stores the
     name the author chose; underneath it are the Preeti byte keys. */
  var LEGACY_FONTS = [
    'preeti', 'kantipur', 'fontasy himali', 'himali', 'sagarmatha',
    'sabdatara', 'pcs nepali'
  ];

  /* word/document.xml and every part that can hold visible text. */
  var TEXT_PARTS = /^word\/(document|header[0-9]*|footer[0-9]*|footnotes|endnotes)\.xml$/;

  /* Elements inside a run that carry formatting, not text. Anything else (a
     break, a tab, a drawing, a field code, a footnote mark) ends the text run,
     so conversion never reads across it. */
  var RUN_FORMAT_TAGS = {
    'w:rPr': 1, 'w:rStyle': 1, 'w:rFonts': 1, 'w:b': 1, 'w:bCs': 1, 'w:i': 1, 'w:iCs': 1,
    'w:caps': 1, 'w:smallCaps': 1, 'w:strike': 1, 'w:dstrike': 1, 'w:outline': 1,
    'w:shadow': 1, 'w:emboss': 1, 'w:imprint': 1, 'w:noProof': 1, 'w:snapToGrid': 1,
    'w:vanish': 1, 'w:webHidden': 1, 'w:color': 1, 'w:spacing': 1, 'w:w': 1,
    'w:kern': 1, 'w:position': 1, 'w:sz': 1, 'w:szCs': 1, 'w:highlight': 1,
    'w:u': 1, 'w:effect': 1, 'w:bdr': 1, 'w:shd': 1, 'w:fitText': 1,
    'w:vertAlign': 1, 'w:rtl': 1, 'w:cs': 1, 'w:em': 1, 'w:lang': 1,
    'w:eastAsianLayout': 1, 'w:specVanish': 1, 'w:oMath': 1, 'w:rPrChange': 1,
    'w:lastRenderedPageBreak': 1
  };

  function docError(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function fail(code, message) { throw docError(code, message); }

  function hasZipSupport() {
    return typeof DecompressionStream === 'function' &&
      typeof CompressionStream === 'function' &&
      typeof Blob === 'function' &&
      typeof Response === 'function' &&
      typeof TextDecoder === 'function' &&
      typeof TextEncoder === 'function';
  }

  /* --------------------------------------------------------------------------
     Zip: read the central directory, inflate only what is edited, and write a
     fresh archive that reuses the original compressed bytes for every entry we
     did not touch. No dependency, no recompression of images or fonts.
     -------------------------------------------------------------------------- */

  var CRC_TABLE = null;

  function crc32(bytes) {
    if (!CRC_TABLE) {
      CRC_TABLE = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        CRC_TABLE[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8Decode(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  function utf8Encode(text) {
    return new TextEncoder().encode(text);
  }

  function streamThrough(bytes, transform) {
    var stream = new Blob([bytes]).stream().pipeThrough(transform);
    return new Response(stream).arrayBuffer().then(function (buffer) {
      return new Uint8Array(buffer);
    });
  }

  function inflateRaw(bytes) {
    if (typeof DecompressionStream !== 'function') {
      return Promise.reject(docError('UNSUPPORTED', 'This browser cannot open .docx files.'));
    }
    return streamThrough(bytes, new DecompressionStream('deflate-raw')).catch(function () {
      throw docError('BAD_ZIP', 'This file could not be unzipped. It may be damaged.');
    });
  }

  function deflateRaw(bytes) {
    return streamThrough(bytes, new CompressionStream('deflate-raw'));
  }

  function readArchive(bytes) {
    if (!bytes || bytes.length < 30) fail('NOT_ZIP', 'This file is not a Word .docx document.');
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
      fail('NOT_ZIP', 'This file is not a Word .docx document. Open it in Word, save it as .docx, then upload it here.');
    }

    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var eocd = -1;
    var floor = Math.max(0, bytes.length - 22 - 0xFFFF);
    for (var i = bytes.length - 22; i >= floor; i--) {
      if (view.getUint32(i, true) === 0x06054B50) { eocd = i; break; }
    }
    if (eocd < 0) fail('NOT_ZIP', 'This file is not a Word .docx document.');

    var total = view.getUint16(eocd + 10, true);
    var cdSize = view.getUint32(eocd + 12, true);
    var cdOffset = view.getUint32(eocd + 16, true);
    if (!total || cdOffset + cdSize > bytes.length) fail('NOT_ZIP', 'This .docx file is damaged or incomplete.');

    var entries = [];
    var pointer = cdOffset;
    for (var n = 0; n < total; n++) {
      if (pointer + 46 > bytes.length || view.getUint32(pointer, true) !== 0x02014B50) {
        fail('NOT_ZIP', 'This .docx file is damaged or incomplete.');
      }
      var flags = view.getUint16(pointer + 8, true);
      var method = view.getUint16(pointer + 10, true);
      var time = view.getUint16(pointer + 12, true);
      var date = view.getUint16(pointer + 14, true);
      var crc = view.getUint32(pointer + 16, true);
      var csize = view.getUint32(pointer + 20, true);
      var usize = view.getUint32(pointer + 24, true);
      var nameLen = view.getUint16(pointer + 28, true);
      var extraLen = view.getUint16(pointer + 30, true);
      var commentLen = view.getUint16(pointer + 32, true);
      var madeBy = view.getUint16(pointer + 4, true);
      var external = view.getUint32(pointer + 38, true);
      var localOffset = view.getUint32(pointer + 42, true);
      var name = utf8Decode(bytes.subarray(pointer + 46, pointer + 46 + nameLen));

      if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF || localOffset === 0xFFFFFFFF) {
        fail('ZIP64', 'This document uses a zip variant Tarikh cannot read. Save it again in Word and retry.');
      }
      if (flags & 0x1) fail('ENCRYPTED', 'This document is password protected. Remove the password in Word, then upload it again.');

      if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034B50) {
        fail('NOT_ZIP', 'This .docx file is damaged or incomplete.');
      }
      var localNameLen = view.getUint16(localOffset + 26, true);
      var localExtraLen = view.getUint16(localOffset + 28, true);
      var dataOffset = localOffset + 30 + localNameLen + localExtraLen;
      if (dataOffset + csize > bytes.length) fail('NOT_ZIP', 'This .docx file is damaged or incomplete.');

      entries.push({
        name: name,
        flags: flags,
        method: method,
        time: time,
        date: date,
        crc: crc,
        csize: csize,
        usize: usize,
        madeBy: madeBy,
        external: external,
        dataOffset: dataOffset
      });
      pointer += 46 + nameLen + extraLen + commentLen;
    }

    return { bytes: bytes, entries: entries };
  }

  function findEntry(archive, name) {
    for (var i = 0; i < archive.entries.length; i++) {
      if (archive.entries[i].name === name) return archive.entries[i];
    }
    return null;
  }

  function readEntry(archive, entry) {
    if (entry.csize === 0) return Promise.resolve(new Uint8Array(0));
    /* The size in the directory is what the part claims to expand to. Checking it
       before inflating keeps a crafted archive from being expanded in memory. */
    if (entry.usize > MAX_PART_BYTES) {
      return Promise.reject(docError('TOO_LARGE', 'One part of this document is too large to convert safely.'));
    }
    var raw = archive.bytes.subarray(entry.dataOffset, entry.dataOffset + entry.csize);
    if (entry.method === 0) {
      if (entry.csize > MAX_PART_BYTES) {
        return Promise.reject(docError('TOO_LARGE', 'One part of this document is too large to convert safely.'));
      }
      return Promise.resolve(raw);
    }
    if (entry.method !== 8) {
      return Promise.reject(docError('COMPRESSION', 'This document uses a compression method Tarikh cannot read.'));
    }
    return inflateRaw(raw).then(function (data) {
      if (data.length > MAX_PART_BYTES) {
        throw docError('TOO_LARGE', 'One part of this document is too large to convert safely.');
      }
      return data;
    });
  }

  function concatChunks(chunks) {
    var length = 0;
    for (var i = 0; i < chunks.length; i++) length += chunks[i].length;
    var out = new Uint8Array(length);
    var offset = 0;
    for (var j = 0; j < chunks.length; j++) {
      out.set(chunks[j], offset);
      offset += chunks[j].length;
    }
    return out;
  }

  /* Build a new archive: edited entries are recompressed, everything else keeps
     the exact compressed bytes Word wrote (crc, sizes and method included). */
  function buildArchive(archive, replacements) {
    var jobs = archive.entries.map(function (entry) {
      var next = Object.prototype.hasOwnProperty.call(replacements, entry.name) ? replacements[entry.name] : null;
      if (!next) {
        return Promise.resolve({
          entry: entry,
          method: entry.method,
          flags: entry.flags & ~0x08,
          crc: entry.crc,
          csize: entry.csize,
          usize: entry.usize,
          payload: archive.bytes.subarray(entry.dataOffset, entry.dataOffset + entry.csize)
        });
      }
      return deflateRaw(next).then(function (compressed) {
        return {
          entry: entry,
          method: 8,
          flags: entry.flags & ~0x08,
          crc: crc32(next),
          csize: compressed.length,
          usize: next.length,
          payload: compressed
        };
      });
    });

    return Promise.all(jobs).then(function (plan) {
      var localChunks = [];
      var centralChunks = [];
      var offset = 0;

      plan.forEach(function (item) {
        var name = utf8Encode(item.entry.name);
        var local = new Uint8Array(30 + name.length);
        var lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034B50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, item.flags, true);
        lv.setUint16(8, item.method, true);
        lv.setUint16(10, item.entry.time, true);
        lv.setUint16(12, item.entry.date, true);
        lv.setUint32(14, item.crc, true);
        lv.setUint32(18, item.csize, true);
        lv.setUint32(22, item.usize, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        local.set(name, 30);

        var central = new Uint8Array(46 + name.length);
        var cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014B50, true);
        cv.setUint16(4, item.entry.madeBy, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, item.flags, true);
        cv.setUint16(10, item.method, true);
        cv.setUint16(12, item.entry.time, true);
        cv.setUint16(14, item.entry.date, true);
        cv.setUint32(16, item.crc, true);
        cv.setUint32(20, item.csize, true);
        cv.setUint32(24, item.usize, true);
        cv.setUint16(28, name.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, item.entry.external, true);
        cv.setUint32(42, offset, true);
        central.set(name, 46);

        localChunks.push(local, item.payload);
        centralChunks.push(central);
        offset += local.length + item.payload.length;
      });

      var centralBytes = concatChunks(centralChunks);
      var end = new Uint8Array(22);
      var ev = new DataView(end.buffer);
      ev.setUint32(0, 0x06054B50, true);
      ev.setUint16(8, plan.length, true);
      ev.setUint16(10, plan.length, true);
      ev.setUint32(12, centralBytes.length, true);
      ev.setUint32(16, offset, true);

      return concatChunks(localChunks.concat([centralBytes, end]));
    });
  }

  /* --------------------------------------------------------------------------
     XML: a scanner, not a parser. Text is spliced in place so the part keeps
     Word's own namespace declarations, attribute order, mc:Ignorable list and
     every extension element we know nothing about.
     -------------------------------------------------------------------------- */

  function parseTag(xml, lt) {
    var length = xml.length;
    var i = lt + 1;
    var closing = false;
    if (xml.charAt(i) === '/') { closing = true; i++; }

    var nameStart = i;
    while (i < length) {
      var c = xml.charAt(i);
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '/' || c === '>') break;
      i++;
    }
    var name = xml.slice(nameStart, i);
    if (!name) return null;

    var quote = '';
    var tagEnd = -1;
    while (i < length) {
      var ch = xml.charAt(i);
      if (quote) { if (ch === quote) quote = ''; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') { tagEnd = i; break; }
      i++;
    }
    if (tagEnd < 0) return null;

    var selfClosing = xml.charAt(tagEnd - 1) === '/';
    return {
      name: name,
      closing: closing,
      selfClosing: selfClosing,
      start: lt,
      attrs: xml.slice(nameStart + name.length, selfClosing ? tagEnd - 1 : tagEnd),
      end: tagEnd + 1
    };
  }

  var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

  function decodeEntities(text) {
    if (text.indexOf('&') === -1) return text;
    return text.replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, function (match, body) {
      if (body.charAt(0) === '#') {
        var code = body.charAt(1) === 'x' || body.charAt(1) === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
        if (isFinite(code) && code >= 0 && code <= 0x10FFFF) {
          try { return String.fromCodePoint(code); } catch (error) { return match; }
        }
        return match;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, body) ? ENTITIES[body] : match;
    });
  }

  function encodeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function attributeValue(attrs, name) {
    var match = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')').exec(attrs);
    if (!match) return '';
    return decodeEntities(match[1] != null ? match[1] : match[2]);
  }

  function hasDevanagari(text) {
    return /[\u0900-\u097F]/.test(text);
  }

  function isLegacyFont(name) {
    if (!name) return false;
    var value = String(name).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    for (var i = 0; i < LEGACY_FONTS.length; i++) {
      var font = LEGACY_FONTS[i];
      if (value === font) return true;
      if (value.indexOf(font) === 0) {
        var next = value.charAt(font.length);
        if (!next || next === ' ' || /[0-9]/.test(next)) return true;
      }
    }
    return false;
  }

  function runFont(run, defaults) {
    if (!run) return '';
    return run.fontAscii || run.fontHAnsi || run.fontCs || run.fontEastAsia || defaults.font;
  }

  /* A run's formatting signature. Runs with the same signature are the same
     formatting as far as the reader is concerned, so merging a word across them
     is invisible. */
  function formattingSignature(run) {
    if (!run || !run.rPrText) return '';
    /* Fonts do not count: every converted run is set in the same Unicode face,
       so a font difference between two runs is not a difference the reader will
       see after conversion. */
    return run.rPrText
      .replace(/w:rsid[A-Za-z]*="[^"]*"/g, '')
      .replace(/<w:rFonts\b[^>]*\/>/g, '');
  }

  /* Characters the engine reported as left as typed, minus the ones the rules
     consumed (reph "{" and the m-suffix are Preeti keys, not leftovers). */
  function leftovers(list, text) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (text.indexOf(list[i].char) !== -1) out.push(list[i]);
    }
    return out;
  }

  function setFontInTag(tag) {
    var seen = 0;
    var updated = tag.replace(/w:(ascii|hAnsi|cs|eastAsia)\s*=\s*(?:"[^"]*"|'[^']*')/g, function (match, name) {
      seen++;
      return 'w:' + name + '="' + UNICODE_FONT + '"';
    });
    if (seen) return updated;
    var insert = ' w:ascii="' + UNICODE_FONT + '" w:hAnsi="' + UNICODE_FONT + '" w:cs="' + UNICODE_FONT + '"';
    if (/\/>\s*$/.test(updated)) return updated.replace(/\s*\/>\s*$/, insert + '/>');
    return updated.replace(/>\s*$/, insert + '/>');
  }

  function newStats() {
    return {
      parts: 0,
      paragraphs: 0,
      paragraphsConverted: 0,
      runsConverted: 0,
      charsIn: 0,
      charsOut: 0,
      alreadyUnicode: 0,
      wordsMerged: 0,
      segmentsMerged: 0,
      unmapped: [],
      passthrough: [],
      fonts: []
    };
  }

  function mergeCounts(target, list) {
    for (var i = 0; i < list.length; i++) {
      var found = false;
      for (var j = 0; j < target.length; j++) {
        if (target[j].char === list[i].char) { target[j].count += list[i].count; found = true; break; }
      }
      if (!found) target.push({ char: list[i].char, count: list[i].count });
    }
  }

  function noteFont(stats, font) {
    if (!font) return;
    for (var i = 0; i < stats.fonts.length; i++) if (stats.fonts[i] === font) return;
    stats.fonts.push(font);
  }

  function splitTokens(text) {
    var tokens = [];
    var i = 0;
    while (i < text.length) {
      var space = /\s/.test(text.charAt(i));
      var j = i + 1;
      while (j < text.length && /\s/.test(text.charAt(j)) === space) j++;
      tokens.push({ start: i, end: j, text: text.slice(i, j), space: space });
      i = j;
    }
    return tokens;
  }

  /* Convert one segment (consecutive runs of the same encoding) and hand the
     result back to the runs the segment came from. */
  function convertSegment(nodes, stats) {
    var full = '';
    var i;
    for (i = 0; i < nodes.length; i++) full += nodes[i].text;

    var result = engine.toUnicode(full);
    stats.charsIn += full.length;
    stats.charsOut += result.text.length;
    mergeCounts(stats.unmapped, leftovers(result.stats.unmapped, result.text));
    mergeCounts(stats.passthrough, leftovers(result.stats.passthrough, result.text));

    for (i = 0; i < nodes.length; i++) {
      nodes[i].run.touched = true;
      noteFont(stats, nodes[i].font);
    }

    if (nodes.length === 1) {
      nodes[0].out = result.text;
      return;
    }

    var offsets = [];
    var running = 0;
    for (i = 0; i < nodes.length; i++) {
      offsets.push(running);
      running += nodes[i].text.length;
    }

    var tokens = splitTokens(full);
    var outs = [];
    for (i = 0; i < nodes.length; i++) outs.push('');

    var cursor = 0;
    for (var t = 0; t < tokens.length; t++) {
      var token = tokens[t];
      while (cursor < nodes.length - 1 && token.start >= offsets[cursor] + nodes[cursor].text.length) cursor++;
      var firstNode = cursor;
      var lastNode = firstNode;
      while (lastNode < nodes.length - 1 && token.end > offsets[lastNode] + nodes[lastNode].text.length) lastNode++;

      outs[firstNode] += engine.toUnicode(token.text).text;

      if (lastNode > firstNode && !token.space) {
        /* A word Word split across a formatting boundary. Keeping every
           character on the first run is the only option that cannot lose or
           duplicate text; it is reported rather than done silently. */
        var signature = formattingSignature(nodes[firstNode].run);
        for (var k = firstNode + 1; k <= lastNode; k++) {
          if (formattingSignature(nodes[k].run) !== signature) { stats.wordsMerged++; break; }
        }
      }
    }

    if (outs.join('') !== result.text) {
      /* The rules are context-sensitive at a syllable level. If splitting at
         word boundaries would change a character, keep the sentence whole on
         the first run instead of guessing. */
      for (i = 0; i < nodes.length; i++) outs[i] = '';
      outs[0] = result.text;
      stats.segmentsMerged++;
    }

    for (i = 0; i < nodes.length; i++) nodes[i].out = outs[i];
  }

  function processPart(xml, mode, defaults, stats) {
    var length = xml.length;
    var pos = 0;
    var paragraphs = [];
    var paraStack = [];
    var runStack = [];
    var para = null;
    var run = null;
    var pendingBreak = true;
    var replacements = [];
    var touchedRuns = [];

    while (pos < length) {
      var lt = xml.indexOf('<', pos);
      if (lt === -1) break;

      if (xml.substr(lt, 4) === '<!--') {
        var comment = xml.indexOf('-->', lt + 4);
        if (comment === -1) break;
        pos = comment + 3;
        continue;
      }
      if (xml.substr(lt, 9) === '<![CDATA[') {
        var cdata = xml.indexOf(']]>', lt + 9);
        if (cdata === -1) break;
        pos = cdata + 3;
        continue;
      }
      if (xml.substr(lt, 2) === '<?') {
        var pi = xml.indexOf('?>', lt + 2);
        if (pi === -1) break;
        pos = pi + 2;
        continue;
      }
      if (xml.substr(lt, 2) === '<!') {
        var decl = xml.indexOf('>', lt + 2);
        if (decl === -1) break;
        pos = decl + 1;
        continue;
      }

      var tag = parseTag(xml, lt);
      if (!tag) fail('BAD_XML', 'This document contains Word markup Tarikh could not read, so nothing was converted.');
      pos = tag.end;

      if (tag.closing) {
        if (tag.name === 'w:p') {
          if (paraStack.length) para = paraStack.pop();
          else para = null;
          run = null;
          runStack.length = 0;
        } else if (tag.name === 'w:r') {
          run = runStack.length ? runStack.pop() : null;
        } else if (tag.name === 'w:rPr' && run && run.rPrDepth > 0) {
          run.rPrDepth--;
          if (run.rPrDepth === 0) run.rPrText = xml.slice(run.rPrStart, tag.end);
        }
        continue;
      }

      if (tag.name === 'w:p') {
        if (tag.selfClosing) continue;
        paraStack.push(para);
        para = { nodes: [], runs: [] };
        paragraphs.push(para);
        stats.paragraphs++;
        pendingBreak = true;
        continue;
      }

      if (tag.name === 'w:r') {
        if (tag.selfClosing) continue;
        runStack.push(run);
        run = {
          para: para,
          fontAscii: '',
          fontHAnsi: '',
          fontCs: '',
          fontEastAsia: '',
          fontsStart: -1,
          fontsEnd: -1,
          rPrDepth: 0,
          rPrStart: -1,
          rPrText: '',
          rPrInnerStart: -1,
          fontInsertAt: -1,
          openEnd: tag.end,
          touched: false
        };
        if (para) para.runs.push(run);
        continue;
      }

      if (tag.name === 'w:rPr' && run) {
        if (tag.selfClosing) continue;
        run.rPrDepth++;
        if (run.rPrDepth === 1) {
          run.rPrStart = tag.start;
          run.rPrInnerStart = tag.end;
        }
        continue;
      }

      if (tag.name === 'w:rStyle' && run) {
        var styleEnd = tag.end;
        if (!tag.selfClosing) {
          var closeStyle = xml.indexOf('</w:rStyle', tag.end);
          if (closeStyle === -1) fail('BAD_XML', 'This document contains Word markup Tarikh could not read, so nothing was converted.');
          var closeStyleEnd = xml.indexOf('>', closeStyle);
          styleEnd = closeStyleEnd === -1 ? length : closeStyleEnd + 1;
          pos = styleEnd;
        }
        if (run.rPrDepth === 1) run.fontInsertAt = styleEnd;
        continue;
      }

      if (tag.name === 'w:rFonts' && run && run.rPrDepth === 1) {
        run.fontsStart = tag.start;
        run.fontsEnd = tag.end;
        run.fontAscii = attributeValue(tag.attrs, 'w:ascii');
        run.fontHAnsi = attributeValue(tag.attrs, 'w:hAnsi');
        run.fontCs = attributeValue(tag.attrs, 'w:cs');
        run.fontEastAsia = attributeValue(tag.attrs, 'w:eastAsia');
        continue;
      }

      if (tag.name === 'w:t' && run && para) {
        var contentStart = tag.end;
        if (tag.selfClosing) {
          continue;
        }
        var contentEnd = xml.indexOf('</w:t', contentStart);
        if (contentEnd === -1) fail('BAD_XML', 'This document contains Word markup Tarikh could not read, so nothing was converted.');
        var raw = xml.slice(contentStart, contentEnd);
        var literal = raw.indexOf('<![CDATA[') !== -1 || raw.indexOf('<!--') !== -1;
        var text = literal ? '' : decodeEntities(raw);
        if (literal) {
          /* Not plain text; leave it byte for byte and stop the current segment
             before it, so the next run is converted on its own. */
          pendingBreak = true;
        } else {
          var font = runFont(run, defaults);
          var node = {
            start: contentStart,
            end: contentEnd,
            raw: raw,
            text: text,
            run: run,
            font: font,
            breakBefore: pendingBreak,
            out: null,
            convertible: false
          };
          if (text) pendingBreak = false;
          if (text) {
            if (hasDevanagari(text)) {
              /* Already Unicode. Leave the characters alone, but a legacy font
                 name on real Devanagari still has to be replaced or Word will
                 fall back to a substitute face. */
              if (isLegacyFont(font)) {
                run.touched = true;
                stats.alreadyUnicode++;
              }
            } else if (mode === 'all' || isLegacyFont(font)) {
              node.convertible = true;
            }
          }
          run.nodes = run.nodes || [];
          run.nodes.push(node);
          para.nodes.push(node);
        }
        var closeEnd = xml.indexOf('>', contentEnd);
        pos = closeEnd === -1 ? length : closeEnd + 1;
        continue;
      }

      /* A field instruction, a deleted revision or any other element inside a
         run ends the text stream; the text after it is a new segment. */
      if (run && !RUN_FORMAT_TAGS[tag.name] && tag.name !== 'w:r' && tag.name !== 'w:t') {
        pendingBreak = true;
        if (tag.name === 'w:instrText' || tag.name === 'w:delText') {
          if (!tag.selfClosing) {
            var skipTo = xml.indexOf('</' + tag.name, tag.end);
            if (skipTo !== -1) {
              var skipEnd = xml.indexOf('>', skipTo);
              pos = skipEnd === -1 ? length : skipEnd + 1;
            }
          }
        }
      }
    }

    /* Plan each paragraph: consecutive convertible nodes form one segment. */
    for (var p = 0; p < paragraphs.length; p++) {
      var paragraph = paragraphs[p];
      var segment = [];
      var paragraphTouched = false;

      for (var n = 0; n < paragraph.nodes.length; n++) {
        var item = paragraph.nodes[n];
        if (!item.text) continue;
        if (!item.convertible || item.breakBefore) {
          if (segment.length) {
            convertSegment(segment, stats);
            paragraphTouched = true;
            segment = [];
          }
          if (!item.convertible) continue;
        }
        segment.push(item);
      }
      if (segment.length) {
        convertSegment(segment, stats);
        paragraphTouched = true;
      }
      if (paragraphTouched) stats.paragraphsConverted++;
    }

    for (var q = 0; q < paragraphs.length; q++) {
      for (var r = 0; r < paragraphs[q].runs.length; r++) {
        if (paragraphs[q].runs[r].touched && touchedRuns.indexOf(paragraphs[q].runs[r]) === -1) {
          touchedRuns.push(paragraphs[q].runs[r]);
        }
      }
    }

    for (var s = 0; s < touchedRuns.length; s++) {
      var touched = touchedRuns[s];
      stats.runsConverted++;
      if (touched.fontsStart !== -1) {
        var tagText = xml.slice(touched.fontsStart, touched.fontsEnd);
        var updated = setFontInTag(tagText);
        if (updated !== tagText) {
          replacements.push({ start: touched.fontsStart, end: touched.fontsEnd, text: updated });
        }
      } else {
        var at = touched.fontInsertAt !== -1
          ? touched.fontInsertAt
          : (touched.rPrInnerStart !== -1 ? touched.rPrInnerStart : touched.openEnd);
        var fonts = '<w:rFonts w:ascii="' + UNICODE_FONT + '" w:hAnsi="' + UNICODE_FONT + '" w:cs="' + UNICODE_FONT + '"/>';
        var insertText = touched.rPrInnerStart === -1 ? '<w:rPr>' + fonts + '</w:rPr>' : fonts;
        replacements.push({ start: at, end: at, text: insertText });
      }
    }

    for (var a = 0; a < paragraphs.length; a++) {
      for (var b = 0; b < paragraphs[a].nodes.length; b++) {
        var node = paragraphs[a].nodes[b];
        if (node.out == null || node.out === node.text) continue;
        replacements.push({ start: node.start, end: node.end, text: encodeText(node.out) });
      }
    }

    if (!replacements.length) return xml;

    /* One pass, front to back: a long document produces thousands of patches and
       re-slicing the whole part for each one would turn a fast conversion into a
       multi-second one. */
    replacements.sort(function (left, right) {
      if (left.start !== right.start) return left.start - right.start;
      return left.end - right.end;
    });

    var chunks = [];
    var cursor = 0;
    for (var z = 0; z < replacements.length; z++) {
      var patch = replacements[z];
      if (patch.start < cursor || patch.end < patch.start) {
        fail('BAD_XML', 'This document contains overlapping Word markup, so nothing was converted.');
      }
      chunks.push(xml.slice(cursor, patch.start), patch.text);
      cursor = patch.end;
    }
    chunks.push(xml.slice(cursor));
    return chunks.join('');
  }

  function defaultFont(stylesXml) {
    if (!stylesXml) return '';
    var at = stylesXml.indexOf('<w:rPrDefault');
    if (at === -1) return '';
    var end = stylesXml.indexOf('</w:rPrDefault>', at);
    var block = end === -1 ? stylesXml.slice(at) : stylesXml.slice(at, end);
    var match = /<w:rFonts\b([^>]*)>/.exec(block);
    if (!match) return '';
    return attributeValue(match[1], 'w:ascii') || attributeValue(match[1], 'w:hAnsi') || attributeValue(match[1], 'w:cs');
  }

  /* --------------------------------------------------------------------------
     Public API
     -------------------------------------------------------------------------- */

  function convertDocument(input, options) {
    options = options || {};
    var mode = options.mode === 'all' ? 'all' : 'auto';

    if (!hasZipSupport()) {
      return Promise.reject(docError('UNSUPPORTED',
        'This browser cannot open .docx files. Use a current version of Chrome, Edge, Firefox or Safari.'));
    }
    if (typeof engine === 'undefined' || !engine) {
      return Promise.reject(docError('ENGINE', 'The Preeti converter did not load. Reload the page and try again.'));
    }

    var bytes;
    if (input instanceof Uint8Array) bytes = input;
    else if (input && typeof input.byteLength === 'number') bytes = new Uint8Array(input);
    else return Promise.reject(docError('NO_FILE', 'Choose a .docx document first.'));

    if (!bytes.length) return Promise.reject(docError('EMPTY', 'That file is empty.'));
    if (bytes.length > MAX_BYTES) {
      return Promise.reject(docError('TOO_LARGE', 'That file is larger than 20 MB. Split it in Word and convert each part.'));
    }

    var archive;
    try {
      archive = readArchive(bytes);
    } catch (error) {
      return Promise.reject(error);
    }

    if (!findEntry(archive, '[Content_Types].xml') || !findEntry(archive, 'word/document.xml')) {
      return Promise.reject(docError('NOT_WORD',
        'That file is not a Word .docx document. Open it in Word, save it as .docx, then upload it again.'));
    }

    var stats = newStats();
    var replacements = {};
    var defaults = { font: '' };
    var stylesEntry = findEntry(archive, 'word/styles.xml');

    var ready = stylesEntry
      ? readEntry(archive, stylesEntry).then(function (data) { defaults.font = defaultFont(utf8Decode(data)); })
      : Promise.resolve();

    return ready.then(function () {
      return archive.entries.reduce(function (chain, entry) {
        if (!TEXT_PARTS.test(entry.name)) return chain;
        return chain.then(function () {
          return readEntry(archive, entry).then(function (data) {
            var xml = utf8Decode(data);
            var converted = processPart(xml, mode, defaults, stats);
            stats.parts++;
            if (converted !== xml) replacements[entry.name] = utf8Encode(converted);
          });
        });
      }, Promise.resolve());
    }).then(function () {
      return buildArchive(archive, replacements);
    }).then(function (output) {
      return {
        blob: new Blob([output], { type: MIME }),
        bytes: output,
        stats: stats
      };
    });
  }

  return {
    convertDocument: convertDocument,
    isSupported: hasZipSupport,
    maxBytes: MAX_BYTES,
    mimeType: MIME,
    unicodeFont: UNICODE_FONT,
    isLegacyFont: isLegacyFont
  };
}));
