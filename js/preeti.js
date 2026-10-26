/* ==========================================================================
   Tarikh — Preeti ↔ Unicode conversion engine

   Two independent converters, not one table read backwards:

   toUnicode()  Preeti ASCII  →  Devanagari Unicode
                Character mapping followed by ordered, context-sensitive rules that
                fix reph ({), pre-base i-matra (l), the m-suffix convention and the
                aa/e compositions Preeti uses for o, au, aa, ii and uu.

   toPreeti()   Devanagari Unicode  →  Preeti ASCII
                Grapheme-cluster encoder. It has to know where the cluster starts
                and ends: Preeti writes the i-matra before its consonant, writes
                reph after the syllable, and uses single glyphs for ligatures
                (त्र, क्ष, द्य, र-कार, य-कार …) that Unicode spells with a halant.
                Reversing the character table alone cannot do any of that.

   Mapping data: the Preeti glyph table is a public encoding, cross-checked
   against two independent implementations (Shuvayatra/preeti, and the ISC
   licensed preeti-unicode package). Only the key→glyph pairs are used; none of
   their code. Whitespace, line breaks and character order are never altered.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarikhPreeti = factory(); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* Preeti ASCII key -> Devanagari glyph(s). */
  var MAP = {
    // independent vowels, vowel signs and marks
    "c": "\u0905", "P": "\u090f", "O": "\u0907", "p": "\u0909", "C": "\u090b", "a": "\u092c", "f": "\u093e", "l": "\u093f", "L": "\u0940", "'": "\u0941", "\"": "\u0942", "[": "\u0943", "]": "\u0947", "}": "\u0948", "+": "\u0902", "F": "\u0901", "M": "\u0903", ".": "\u0964", "=": ".", "\\": "\u094d", "\u2018": "\u0945",
    // consonants, half forms and conjunct glyphs
    "ˆ": "फ्",
    "s": "\u0915", "v": "\u0916", "u": "\u0917", "3": "\u0918", "\u00aa": "\u0919", "r": "\u091a", "5": "\u091b", "h": "\u091c", "\u00b4": "\u091d", "`": "\u091e", "6": "\u091f", "7": "\u0920", "8": "\u0921", "9": "\u0922", "t": "\u0924", "y": "\u0925", "b": "\u0926", "w": "\u0927", "g": "\u0928", "k": "\u092a", "e": "\u092d", "d": "\u092e", "o": "\u092f", "/": "\u0930", "n": "\u0932", "j": "\u0935", "z": "\u0936", ";": "\u0938", "x": "\u0939", "\u00a9": "\u0930", "\u00a1": "\u091c\u094d\u091e\u094d", "I": "\u0915\u094d\u0937\u094d", "1": "\u091c\u094d\u091e", "i": "\u0937\u094d", "0": "\u0923\u094d", "~": "\u091e\u094d", ":": "\u0938\u094d", "Q": "\u0924\u094d\u0924", "q": "\u0924\u094d\u0930", ">": "\u0936\u094d\u0930", "B": "\u0926\u094d\u092f", "\u00e5": "\u0926\u094d\u0935", "4": "\u0926\u094d\u0927", "2": "\u0926\u094d\u0926", "\u00df": "\u0926\u094d\u092e", "\u203a": "\u0926\u094d\u0930", "\u00a2": "\u0926\u094d\u0918", "\u00a7": "\u091f\u094d\u091f", "\u00b6": "\u0920\u094d\u0920", "\u00dd": "\u091f\u094d\u0920", "\u2022": "\u0921\u094d\u0921", "\u00cd": "\u0919\u094d\u0915", "\u00ce": "\u0919\u094d\u0916", "\u00cb": "\u0919\u094d\u0917", "\u2039": "\u0919\u094d\u0918", "\u00b0": "\u0919\u094d\u0922", "\u00cc": "\u0928\u094d\u0928", "\u00c5": "\u0939\u0943", "\u00bf": "\u0930\u0942", "?": "\u0930\u0941", "\u201e": "\u0927\u094d\u0930", "\u00d8": "\u094d\u092f", "\u00ab": "\u094d\u0930", "|": "\u094d\u0930", "V": "\u0916\u094d", "R": "\u091a\u094d", "Z": "\u0936\u094d", "N": "\u0932\u094d", "J": "\u0935\u094d", "\u00a3": "\u0918\u094d", "W": "\u0927\u094d", "G": "\u0928\u094d", "K": "\u092a\u094d", "A": "\u092c\u094d", "E": "\u092d\u094d", "D": "\u092e\u094d", "T": "\u0924\u094d", "Y": "\u0925\u094d", "U": "\u0917\u094d", "S": "\u0915\u094d", "H": "\u091c\u094d", "X": "\u0939\u094d", "\u00a4": "\u091d\u094d", "\u2030": "\u091d\u094d",
    // digits
    "!": "\u0967", "@": "\u0968", "#": "\u0969", "$": "\u096a", "%": "\u096b", "^": "\u096c", "&": "\u096d", "*": "\u096e", "(": "\u096f", ")": "\u0966",
    // punctuation, symbols and glyph-only keys
    "\u00d6": "=", "\u00db": "!", "<": "?", "-": "(", "_": ")", "\u00d9": ";", "\u00b1": "+", "\u00dc": "%", "\u00f7": "/", "\u00e6": "\u201c", "\u00c6": "\u201d", "\u2026": "\u2018", "\u00da": "\u2019", "\u02dc": "\u093d", "\u00e7": "\u0950", "\u00d7": "\u00d7", "\u00d2": "\u00a8", "\u00a5": "\u0930\u094d\u200d", ",": ",",
  };

  /* Rules applied after the character mapping, in this order. Each is a global
     regex replace, exactly as the encoding needs it to be applied. */
  var PRE_REPH_RULES = [
    // Preeti types the inherent "a" of letters without a full-form key as halant + aa.
    ['\u094d\u093e', ''],
    // The m suffix: typed after a syllable it marks a variant glyph (क्र, क्त, झ, फ, ऊ).
    ['(\u0924\u094d\u0930|\u0924\u094d\u0924)([^\u0909\u092d\u092a]+?)m', '$1m$2'],
    ['\u0924\u094d\u0930m', '\u0915\u094d\u0930'],
    ['\u0924\u094d\u0924m', '\u0915\u094d\u0924'],
    ['([^\u0909\u092d\u092a]+?)m', 'm$1'],
    ['\u0909m', '\u090a'],
    ['\u092dm', '\u091d'],
    ['\u092am', '\u092b'],
    // Independent ii is typed as i followed by reph.
    ['\u0907{', '\u0908'],
    // Pre-base i-matra moves after its consonant cluster.
    ['\u093f((.\u094d)*[^\u094d])', '$1\u093f']
  ];

  var POST_REPH_RULES = [
    // Matras typed before a half letter belong to the following consonant.
    ['([\u093e\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0902\u0903\u0901]+?)(\u094d(.\u094d)*[^\u094d])', '$2$1'],
    ['\u094d([\u093e\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0902\u0903\u0901]+?)((.\u094d)*[^\u094d])', '\u094d$2$1'],
    ['([\u0902\u0901])([\u093e\u093f\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0903]*)', '$2$1'],
    // Collapse the doubled keys a fast typist produces.
    ['\u0901\u0901', '\u0901'],
    ['\u0902\u0902', '\u0902'],
    ['\u0947\u0947', '\u0947'],
    ['\u0948\u0948', '\u0948'],
    ['\u0941\u0941', '\u0941'],
    ['\u0942\u0942', '\u0942'],
    ['\u091f\u0943', '\u091f\u094d\u091f'],
    // aa + e / ai compose o and au; the same pair typed in the other order.
    ['\u0947\u093e', '\u093e\u0947'],
    ['\u0948\u093e', '\u093e\u0948'],
    ['\u0905\u093e\u0947', '\u0913'],
    ['\u0905\u093e\u0948', '\u0914'],
    ['\u0905\u093e', '\u0906'],
    ['\u090f\u0947', '\u0910'],
    ['\u093e\u0947', '\u094b'],
    ['\u093e\u0948', '\u094c']
  ];

  function compile(rules) {
    var out = [];
    for (var i = 0; i < rules.length; i++) out.push([new RegExp(rules[i][0], 'g'), rules[i][1]]);
    return out;
  }

  var PRE_REPH = compile(PRE_REPH_RULES);
  var POST_REPH = compile(POST_REPH_RULES);

  /* Matras, anusvara, visarga, nukta: characters that sit on a consonant. */
  var MARK_RE = /[\u0900-\u0903\u093a-\u094f\u0951-\u0957\u0962\u0963]/;

  /* --------------------------------------------------------------------------
     Preeti → Unicode
     -------------------------------------------------------------------------- */

  /* Preeti writes reph as "{" after the syllable it belongs to. Move it in front
     of the last consonant of that syllable, matras and all, which is where
     Unicode wants the "र्". */
  function resolveReph(text) {
    if (text.indexOf('{') === -1) return text;
    var chars = Array.from(text);
    var i = 0;
    while (i < chars.length) {
      if (chars[i] !== '{') { i++; continue; }
      var j = i - 1;
      while (j >= 0 && MARK_RE.test(chars[j]) && chars[j] !== '\u094d') j--;
      chars.splice(i, 1);
      if (j < 0) {
        chars.unshift('\u0930', '\u094d');
        i += 1;
      } else {
        chars.splice(j, 0, '\u0930', '\u094d');
        i += 1;
      }
    }
    return chars.join('');
  }

  function count(list, ch, n) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].char === ch) { list[i].count += n; return; }
    }
    list.push({ char: ch, count: n });
  }

  function toUnicode(input) {
    var text = String(input == null ? '' : input);
    var chars = Array.from(text);
    var out = '';
    var unmapped = [];
    var devanagari = 0;
    var letters = 0;

    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (Object.prototype.hasOwnProperty.call(MAP, ch)) {
        out += MAP[ch];
        letters++;
        continue;
      }
      out += ch;
      if (/\s/.test(ch)) continue;
      letters++;
      if (/[\u0900-\u097f]/.test(ch)) { devanagari++; continue; }
      count(unmapped, ch, 1);
    }

    for (var a = 0; a < PRE_REPH.length; a++) {
      out = out.replace(PRE_REPH[a][0], PRE_REPH[a][1]);
    }
    out = resolveReph(out);
    for (var b = 0; b < POST_REPH.length; b++) {
      out = out.replace(POST_REPH[b][0], POST_REPH[b][1]);
    }

    return {
      text: out,
      stats: {
        direction: 'toUnicode',
        charsIn: chars.length,
        charsOut: Array.from(out).length,
        lines: text.split('\n').length,
        unmapped: unmapped,
        passthrough: [],
        // A page of Devanagari pasted into the Preeti box means the mode is wrong.
        wrongDirection: letters > 4 && devanagari / letters > 0.6
      }
    };
  }

  /* --------------------------------------------------------------------------
     Unicode → Preeti
     -------------------------------------------------------------------------- */

  var CONSONANT_FULL = {
    '\u0915': 's', '\u0916': 'v', '\u0917': 'u', '\u0918': '3', '\u0919': '\u00aa',
    '\u091a': 'r', '\u091b': '5', '\u091c': 'h', '\u091d': '\u00b4', '\u091e': '`',
    '\u091f': '6', '\u0920': '7', '\u0921': '8', '\u0922': '9', '\u0923': '0f',
    '\u0924': 't', '\u0925': 'y', '\u0926': 'b', '\u0927': 'w', '\u0928': 'g',
    '\u092a': 'k', '\u092b': 'km', '\u092c': 'a', '\u092d': 'e', '\u092e': 'd',
    '\u092f': 'o', '\u0930': '/', '\u0932': 'n', '\u0935': 'j', '\u0936': 'z',
    '\u0937': 'if', '\u0938': ';', '\u0939': 'x'
  };

  /* Half forms. Preeti's halant is a visible glyph, so a conjunct that has no
     ligature key must use the half form, not a full letter plus halant. */
  var CONSONANT_HALF = {
    '\u0915': 'S', '\u0916': 'V', '\u0917': 'U', '\u0918': '\u00a3', '\u0919': '\u00aa\\',
    '\u091a': 'R', '\u091b': '5\\', '\u091c': 'H', '\u091d': '\u00a4', '\u091e': '~',
    '\u091f': '6\\', '\u0920': '7\\', '\u0921': '8\\', '\u0922': '9\\', '\u0923': '0',
    '\u0924': 'T', '\u0925': 'Y', '\u0926': 'b\\', '\u0927': 'W', '\u0928': 'G',
    '\u092a': 'K', '\u092b': '\u02c6', '\u092c': 'A', '\u092d': 'E', '\u092e': 'D',
    '\u092f': 'o\\', '\u0930': '/\\', '\u0932': 'N', '\u0935': 'J', '\u0936': 'Z',
    '\u0937': 'i', '\u0938': ':', '\u0939': 'X'
  };

  /* Ligatures Preeti has a single glyph for. [unicode, full form, halant form] */
  var LIGATURES = [
    ['\u0915\u094d\u0937', 'If', 'I'],            // क्ष
    ['\u091c\u094d\u091e', '1', '\u00a1'],        // ज्ञ
    ['\u0924\u094d\u0930', 'q', 'q\\'],           // त्र
    ['\u0924\u094d\u0924', 'Q', 'Q\\'],           // त्त
    ['\u0936\u094d\u0930', '>', '>\\'],           // श्र
    ['\u0926\u094d\u092f', 'B', 'B\\'],           // द्य
    ['\u0926\u094d\u0935', '\u00e5', '\u00e5\\'], // द्व
    ['\u0926\u094d\u0927', '4', '4\\'],           // द्ध
    ['\u0926\u094d\u0926', '2', '2\\'],           // द्द
    ['\u0926\u094d\u092e', '\u00df', '\u00df\\'], // द्म
    ['\u0926\u094d\u0930', '\u203a', '\u203a\\'], // द्र
    ['\u0926\u094d\u0918', '\u00a2', '\u00a2\\'], // द्घ
    ['\u091f\u094d\u091f', '\u00a7', '\u00a7\\'], // ट्ट
    ['\u0920\u094d\u0920', '\u00b6', '\u00b6\\'], // ठ्ठ
    ['\u0921\u094d\u0921', '\u2022', '\u2022\\'], // ड्ड
    ['\u0919\u094d\u0915', '\u00cd', '\u00cd\\'], // ङ्क
    ['\u0919\u094d\u0916', '\u00ce', '\u00ce\\'], // ङ्ख
    ['\u0919\u094d\u0917', '\u00cb', '\u00cb\\'], // ङ्ग
    ['\u0919\u094d\u0918', '\u2039', '\u2039\\'], // ङ्घ
    ['\u0919\u094d\u0922', '\u00b0', '\u00b0\\'], // ङ्ढ
    ['\u0928\u094d\u0928', '\u00cc', '\u00cc\\'], // न्न
    ['\u0939\u0943', '\u00c5', '\u00c5'],        // हृ
    ['\u0930\u0941', '?', '?'],                  // रु
    ['\u0930\u0942', '\u00bf', '\u00bf']        // रू
  ];

  var INDEPENDENT_VOWEL = {
    '\u0905': 'c', '\u0906': 'cf', '\u0907': 'O', '\u0908': 'O{', '\u0909': 'p',
    '\u090a': 'pm', '\u090b': 'C', '\u090f': 'P', '\u0910': 'P]', '\u0913': 'cf]',
    '\u0914': 'cf}', '\u0950': '\u00e7'
  };

  var VOWEL_SIGN = {
    '\u093e': 'f', '\u0940': 'L', '\u0941': "'", '\u0942': '"', '\u0943': '[',
    '\u0947': ']', '\u0948': '}', '\u094b': 'f]', '\u094c': 'f}', '\u0945': '\u2018',
    '\u094d': '\\'
  };

  var MARK_SIGN = { '\u0901': 'F', '\u0902': '+', '\u0903': 'M' };

  /* Devanagari numerals sit on the shifted number row in the Preeti layout. */
  var DIGIT = {
    '\u0966': ')', '\u0967': '!', '\u0968': '@', '\u0969': '#', '\u096a': '$',
    '\u096b': '%', '\u096c': '^', '\u096d': '&', '\u096e': '*', '\u096f': '('
  };

  /* Literal punctuation gets the Preeti key that renders it, not the ASCII byte. */
  var PUNCTUATION = {
    '\u0964': '.', '.': '=', '!': '\u00db', '?': '<', '(': '-', ')': '_',
    ';': '\u00d9', '=': '\u00d6', '%': '\u00dc', '+': '\u00b1', '/': '\u00f7',
    '\u201c': '\u00e6', '\u201d': '\u00c6', '\u2018': '\u2026', '\u2019': '\u00da',
    '\u091d\u094d': '\u00a4'
  };

  function isConsonant(ch) {
    return ch >= '\u0915' && ch <= '\u0939' && !!CONSONANT_FULL[ch];
  }

  function ligatureAt(text, i) {
    for (var k = 0; k < LIGATURES.length; k++) {
      if (text.startsWith(LIGATURES[k][0], i)) return LIGATURES[k];
    }
    return null;
  }

  function toPreeti(input) {
    var text = String(input == null ? '' : input).normalize('NFC');
    var chars = Array.from(text);
    var out = '';
    var unmapped = [];
    var passthrough = [];
    var i = 0;
    var reph = false;

    while (i < chars.length) {
      var ch = chars[i];

      /* Reph: "र्" before a consonant is written after the syllable in Preeti. */
      if (ch === '\u0930' && chars[i + 1] === '\u094d' &&
          (isConsonant(chars[i + 2]) || ligatureAt(text, i + 2))) {
        reph = true;
        i += 2;
        continue;
      }

      var lig = ligatureAt(text, i);
      if (!lig && !isConsonant(ch)) {
        /* Everything that is not a cluster. */
        if (Object.prototype.hasOwnProperty.call(INDEPENDENT_VOWEL, ch)) {
          out += INDEPENDENT_VOWEL[ch];
          i++;
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(MARK_SIGN, ch)) {
          out += MARK_SIGN[ch];
          i++;
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(VOWEL_SIGN, ch)) {
          out += VOWEL_SIGN[ch];
          i++;
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(DIGIT, ch)) {
          out += DIGIT[ch];
          i++;
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(PUNCTUATION, ch)) {
          out += PUNCTUATION[ch];
          i++;
          continue;
        }
        if (/\s/.test(ch) || /[0-9A-Za-z]/.test(ch)) {
          out += ch;
          i++;
          continue;
        }
        if (/[\u0900-\u097f]/.test(ch)) count(unmapped, ch, 1);
        else count(passthrough, ch, 1);
        out += ch;
        i++;
        continue;
      }

      /* Collect the whole cluster: consonants joined by halants, then marks. */
      var units = [];      // {full, half}
      var endsHalant = false;

      while (i < chars.length) {
        var next = ligatureAt(text, i);
        if (next) {
          units.push({ full: next[1], half: next[2] });
          i += Array.from(next[0]).length;
        } else if (isConsonant(chars[i])) {
          var c = chars[i];
          units.push({ full: CONSONANT_FULL[c], half: CONSONANT_HALF[c] });
          i += 1;
        } else {
          break;
        }
        if (chars[i] === '\u093c') { count(unmapped, chars[i], 1); i++; }   // nukta has no Preeti key
        if (chars[i] === '\u094d') {
          var after = chars[i + 1];
          if (after && (isConsonant(after) || ligatureAt(text, i + 1))) {
            i += 1;                                // halant joins the next consonant
            continue;
          }
          endsHalant = true;
          i += 1;
          break;
        }
        break;
      }

      if (!units.length) { out += ch; i++; continue; }

        /* R-कार: a final र becomes the subjoined form of the consonant before it.
         Other conjuncts use half letters, which is what Preeti users type. */
      var attached = '';
      if (!endsHalant && units.length >= 2 && units[units.length - 1].full === '/') {
        attached = '|';
        units.pop();
      }

      var body = '';
      for (var u = 0; u < units.length; u++) {
        body += (u === units.length - 1 && !endsHalant) ? units[u].full : units[u].half;
      }

      /* Matras and other marks after the cluster. The i-matra is written before
         the consonant it belongs to, so it is held back and prefixed. */
      var signs = '';
      var preBase = false;
      while (i < chars.length) {
        var m = chars[i];
        if (m === '\u093f') { preBase = true; i++; continue; }              // ि
        if (Object.prototype.hasOwnProperty.call(MARK_SIGN, m)) { signs += MARK_SIGN[m]; i++; continue; }
        if (Object.prototype.hasOwnProperty.call(VOWEL_SIGN, m)) { signs += VOWEL_SIGN[m]; i++; continue; }
        break;
      }

      out += (preBase ? 'l' : '') + body + attached + signs + (reph ? '{' : '');
      reph = false;
    }

    return {
      text: out,
      stats: {
        direction: 'toPreeti',
        charsIn: chars.length,
        charsOut: Array.from(out).length,
        lines: text.split('\n').length,
        unmapped: unmapped,
        passthrough: passthrough,
        wrongDirection: false
      }
    };
  }

  return {
    toUnicode: toUnicode,
    toPreeti: toPreeti,
    map: MAP,
    rules: { reph: PRE_REPH_RULES.concat(POST_REPH_RULES) }
  };
}));
