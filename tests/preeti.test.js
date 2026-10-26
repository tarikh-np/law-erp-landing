/* Preeti ↔ Unicode engine tests.
   Run with: npm test   (node --test tests/)

   Expected values were read from the Devanagari side and cross-checked against an
   independent implementation of the same published mapping table. The Preeti
   column is the string the same document holds when typed in the Preeti layout,
   so these are the vectors a converter has to reproduce. */
const test = require('node:test');
const assert = require('node:assert/strict');
const preeti = require('../js/preeti.js');

const toUnicode = (s) => preeti.toUnicode(s).text;
const toPreeti = (s) => preeti.toPreeti(s).text;

test('common words convert Preeti to Unicode', () => {
  const cases = [
    ['g]kfn', 'नेपाल'],
    ['sf7df8f}+', 'काठमाडौं'],
    ['g]kfnL', 'नेपाली'],
    ['s]xL', 'केही'],
    ["x'g'", 'हुनु'],
    ['u/]sf]', 'गरेको'],
    ['ePsf]', 'भएको'],
    ['5}g', 'छैन'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('legal terminology converts Preeti to Unicode', () => {
  const cases = [
    ['cbfnt', 'अदालत'],
    ["d'2f", 'मुद्दा'],
    ['k]zL', 'पेशी'],
    ['tfl/v', 'तारिख'],
    [';fIfL', 'साक्षी'],
    ['k|ltjfbL', 'प्रतिवादी'],
    ['cfb]z', 'आदेश'],
    ['lg0f{o', 'निर्णय'],
    ['clwsf/L', 'अधिकारी'],
    ['ljBfno', 'विद्यालय'],
    ['g]kfnsf] sfg"g', 'नेपालको कानून'],
    ['kl/of]hgf', 'परियोजना'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('names and addresses convert Preeti to Unicode', () => {
  const cases = [
    ['z]if k|;fb', 'शेष प्रसाद'],
    ["nlntk'/", 'ललितपुर'],
    ['cfwf/e"t', 'आधारभूत'],
    ['ljZjf;', 'विश्वास'],
    ['sNof0fL', 'कल्याणी'],
    ['df]/Ë', 'मोरङ्ग'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('conjunct consonants, half letters and ligatures', () => {
  const cases = [
    ['If]q', 'क्षेत्र'],
    ['cIf/', 'अक्षर'],
    ['1fg', 'ज्ञान'],
    ['kq', 'पत्र'],
    ['åf/f', 'द्वारा'],
    ["a'4", 'बुद्ध'],
    ['§', 'ट्ट'],
    ['Åbo', 'हृदय'],
    ['>Ldfg', 'श्रीमान'],
    ['jfBfIf/', 'वाद्याक्षर'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('every matra combination', () => {
  const cases = [
    ['sf', 'का'],
    ['ls', 'कि'],
    ['sL', 'की'],
    ["s'", 'कु'],
    ['s"', 'कू'],
    ['s[', 'कृ'],
    ['s]', 'के'],
    ['s}', 'कै'],
    ['sf]', 'को'],
    ['sf}', 'कौ'],
    ['s+', 'कं'],
    ['sF', 'कँ'],
    ['sM', 'कः'],
    ['c', 'अ'],
    ['cf', 'आ'],
    ['O', 'इ'],
    ['O{', 'ई'],
    ['p', 'उ'],
    ['pm', 'ऊ'],
    ['C', 'ऋ'],
    ['P', 'ए'],
    ['P]', 'ऐ'],
    ['cf]', 'ओ'],
    ['cf}', 'औ'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('reph and rakar forms', () => {
  const cases = [
    ['sfo{', 'कार्य'],
    ['sd{', 'कर्म'],
    ['sdL{', 'कर्मी'],
    ['zLif{', 'शीर्ष'],
    [';jf]{Rr', 'सर्वोच्च'],
    ['k|ltef', 'प्रतिभा'],
    ['k|zf;g', 'प्रशासन'],
    ['¿', 'रू'],
    ['?', 'रु'],
  ];
  for (const [source, expected] of cases) assert.equal(toUnicode(source), expected, source);
});

test('Preeti punctuation and Devanagari numerals', () => {
  assert.equal(toUnicode('='), '.');
  assert.equal(toUnicode('.'), '।');
  assert.equal(toUnicode('!'), '१');
  assert.equal(toUnicode('@)*#'), '२०८३');
  assert.equal(toUnicode('@)*#=)^=#!'), '२०८३.०६.३१');
  assert.equal(toUnicode('Ü'), '%');
  assert.equal(toUnicode('<'), '?');
  assert.equal(toUnicode(';'), 'स');
});

test('Unicode to Preeti matches the layout people actually type', () => {
  const cases = [
    ['नेपाल', 'g]kfn'],
    ['काठमाडौं', 'sf7df8f}+'],
    ['तारिख', 'tfl/v'],
    ['मिति', 'ldlt'],
    ['पेशी', 'k]zL'],
    ['अदालत', 'cbfnt'],
    ['मुद्दा', "d'2f"],
    ['प्रतिवादी', 'k|ltjfbL'],
    ['सर्वोच्च अदालत', ';jf]{Rr cbfnt'],
    ['व्यवस्था', 'Joj:yf'],
    ['न्यायाधीश', 'GofofwLz'],
    ['क्षेत्र', 'If]q'],
    ['ज्ञान', '1fg'],
    ['हृदय', 'Åbo'],
    ['ऋण', 'C0f'],
    ['ऊन', 'pmg'],
    ['ईश्वर', 'O{Zj/'],
    ['ललितपुर', "nlntk'/"],
    ['२०८३।०६।३१', '@)*#.)^.#!'],
  ];
  for (const [source, expected] of cases) assert.equal(toPreeti(source), expected, source);
});

test('Unicode to Preeti keeps English, digits and whitespace as typed', () => {
  assert.equal(toPreeti('Supreme Court 2024'), 'Supreme Court 2024');
  assert.equal(toPreeti('नेपाल\n\nकाठमाडौं'), 'g]kfn\n\nsf7df8f}+');
  assert.equal(toPreeti('  नेपाल  '), '  g]kfn  ');
});

test('paragraphs, blank lines and clause numbers survive both directions', () => {
  const doc = [
    'श्रीमान् न्यायाधीशज्यू,',
    '',
    'विषय — पेशी तारिख बारे निवेदन।',
    '',
    '१. उपर्युक्त विषयमा यो निवेदन पेश गरेको छु।',
    '२. मुद्दाको तारिख २०८३।०६।३१ मा तोकिएको छ।',
    '३. अदालतबाट आदेश हुनुहुनेछ।',
    '',
    'भवदीय,',
    'नेपाल',
  ].join('\n');

  const legacy = toPreeti(doc);
  assert.equal(legacy.split('\n').length, doc.split('\n').length);
  assert.equal(toUnicode(legacy), doc);

  const stats = preeti.toUnicode(legacy).stats;
  assert.equal(stats.lines, doc.split('\n').length);
  assert.equal(stats.wrongDirection, false);
});

test('a long document is converted whole and keeps its shape', () => {
  const paragraph = 'मुद्दा नं. ०८२ सीआर ०१२३ को तारिखमा उपस्थित हुनुहुन्छ भन्ने जानकारी गराइन्छ।';
  const numerals = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'];
  const doc = Array.from({ length: 400 }, (_, i) => `${numerals[i % 10]}. ${paragraph}`).join('\n\n');
  const legacy = toPreeti(doc);
  const out = preeti.toUnicode(legacy);

  assert.equal(out.text.split('\n').length, doc.split('\n').length);
  assert.equal(out.text, doc);
  assert.equal(out.stats.lines, 799);
});

test('empty and whitespace-only input is handled', () => {
  assert.equal(preeti.toUnicode('').text, '');
  assert.equal(preeti.toPreeti('').text, '');
  assert.equal(preeti.toUnicode('   ').text, '   ');
  assert.equal(preeti.toUnicode('\n\n').text, '\n\n');
  assert.equal(preeti.toUnicode(null).text, '');
  assert.equal(preeti.toPreeti(undefined).text, '');
  assert.equal(preeti.toUnicode('').stats.wrongDirection, false);
});

test('unmapped characters are preserved and reported, never dropped', () => {
  const mapped = preeti.toUnicode('g]kfn 😀');
  assert.equal(mapped.text, 'नेपाल 😀');
  assert.deepEqual(mapped.stats.unmapped, [{ char: '😀', count: 1 }]);

  const devanagariInput = preeti.toUnicode('नेपाल');
  assert.equal(devanagariInput.text, 'नेपाल');
  assert.equal(devanagariInput.stats.wrongDirection, true);
});

test('Unicode to Preeti reports Devanagari it cannot represent', () => {
  /* क़ is क + nukta; Preeti has no nukta consonant, so the nukta is reported. */
  const out = preeti.toPreeti('नेपाल क़');
  assert.equal(out.text, 'g]kfn s');
  assert.deepEqual(out.stats.unmapped, [{ char: '़', count: 1 }]);
});

test('Latin text and figures are left as typed, not turned into Preeti glyphs', () => {
  const out = preeti.toPreeti('मुद्दा नं. 082-CR-0123');
  assert.match(out.text, /082/);
  assert.match(out.text, /CR/);
});

test('converted output can be fed back in without changing it', () => {
  const devanagari = toUnicode('sfg"gsf] cbfntdf k]zL k/Lsf sfo{ kfof]');
  assert.equal(toUnicode(devanagari), devanagari);
  const legacy = toPreeti(devanagari);
  assert.equal(toUnicode(legacy), devanagari);
});

test('characters Preeti has no key for are left as typed and reported', () => {
  /* Preeti types : as स् and - as ( , so neither character exists in the font. */
  const out = preeti.toPreeti('विषय: मुद्दा नं. ०८२-सीआर');
  assert.equal(out.text, 'ljifo: d\'2f g+= )*@-;Lcf/');
  assert.deepEqual(out.stats.passthrough, [{ char: ':', count: 1 }, { char: '-', count: 1 }]);
  assert.equal(out.stats.unmapped.length, 0);
});

test('the whole lexicon round-trips through both engines', () => {
  const words = [
    'नेपाल', 'काठमाडौं', 'तारिख', 'पेशी', 'अदालत', 'मुद्दा', 'कानून', 'सरकार',
    'वकिल', 'फैसला', 'इजलास', 'न्याय', 'प्रतिवादी', 'साक्षी', 'बयान', 'रिट',
    'निवेदन', 'अनुमति', 'आदेश', 'निर्णय', 'अधिकारी', 'कार्य', 'कर्म', 'कर्मी',
    'शीर्ष', 'भारत', 'क्षेत्र', 'ज्ञान', 'हृदय', 'ऋण', 'ऊन', 'ईश्वर', 'औषधि',
    'संविधान', 'व्यवस्था', 'सत्य', 'न्यायाधीश', 'सर्वोच्च अदालत', 'मन्त्री',
    'प्रक्रिया', 'अभिव्यक्ति', 'सम्पत्ति', 'कम्पनी', 'मूल्य', '२०८३।०६।३१',
  ];
  for (const word of words) assert.equal(toUnicode(toPreeti(word)), word, word);
});
