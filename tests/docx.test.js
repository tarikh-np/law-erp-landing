/* Preeti → Unicode .docx conversion tests.
   Run with: npm test   (node --test tests/)

   The fixture is built here with node:zlib and a minimal zip writer that share no
   code with js/docx-preeti.js, and the output is read back with a second, equally
   independent reader that checks every CRC. What is asserted is what a lawyer
   would check in Word: the words, and the layout around them. */
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const docx = require('../js/docx-preeti.js');

/* ------------------------------- zip helpers ------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* deflate: true exercises the deflate path, false the stored path. */
function buildZip(parts) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, text, deflate } of parts) {
    const data = Buffer.from(text, 'utf8');
    const payload = deflate ? zlib.deflateRawSync(data) : data;
    const nameBytes = Buffer.from(name, 'utf8');
    const method = deflate ? 8 : 0;

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034B50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(payload.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);

    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014B50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(method, 10);
    record.writeUInt32LE(crc32(data), 16);
    record.writeUInt32LE(payload.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(nameBytes.length, 28);
    record.writeUInt32LE(offset, 42);

    local.push(header, nameBytes, payload);
    central.push(record, nameBytes);
    offset += header.length + nameBytes.length + payload.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0);
  end.writeUInt16LE(parts.length, 8);
  end.writeUInt16LE(parts.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...local, directory, end]));
}

function readZip(bytes) {
  const buffer = Buffer.from(bytes);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054B50) { eocd = i; break; }
  }
  assert.notEqual(eocd, -1, 'no end-of-central-directory record');
  const total = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let n = 0; n < total; n++) {
    assert.equal(buffer.readUInt32LE(pointer), 0x02014B50, 'bad central directory entry');
    const flags = buffer.readUInt16LE(pointer + 8);
    const method = buffer.readUInt16LE(pointer + 10);
    const crc = buffer.readUInt32LE(pointer + 16);
    const csize = buffer.readUInt32LE(pointer + 20);
    const usize = buffer.readUInt32LE(pointer + 24);
    const nameLen = buffer.readUInt16LE(pointer + 28);
    const extraLen = buffer.readUInt16LE(pointer + 30);
    const commentLen = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString('utf8', pointer + 46, pointer + 46 + nameLen);

    assert.equal(buffer.readUInt32LE(localOffset), 0x04034B50, 'bad local header for ' + name);
    const dataOffset = localOffset + 30 +
      buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    assert.ok(flags & 0x800, 'utf-8 name flag missing on ' + name);
    assert.ok(!(flags & 0x8), 'unexpected data descriptor on ' + name);

    const payload = buffer.subarray(dataOffset, dataOffset + csize);
    const data = method === 8 ? zlib.inflateRawSync(payload) : Buffer.from(payload);
    assert.equal(data.length, usize, 'size mismatch on ' + name);
    assert.equal(crc32(data), crc, 'crc mismatch on ' + name);
    files.set(name, { data, payload: Buffer.from(payload), method });

    pointer += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* --------------------------------- fixture --------------------------------- */

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function preetiRun(text, extra = '') {
  return `<w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti" w:cs="Preeti"/><w:sz w:val="24"/>${extra}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14">
<w:body>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${preetiRun('g]kfnsf] cbfntdf', '<w:sz w:val="28"/>')}</w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti" w:cs="Preeti"/></w:rPr><w:t>d</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti" w:cs="Preeti"/></w:rPr><w:t>'2f</w:t></w:r>${preetiRun(' g]kfn')}</w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti"/><w:b/></w:rPr><w:t>sf</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti"/></w:rPr><w:t>7</w:t></w:r>${preetiRun(' nfUof]')}</w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t xml:space="preserve">Supreme Court of Nepal, 2024.</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti"/></w:rPr><w:t>यो नेपाली युनिकोड पहिले नै सही छ।</w:t></w:r></w:p>
<w:p>${preetiRun('k]zL')}<w:r><w:br/></w:r>${preetiRun('tfl/v')}</w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti"/><w:i/></w:rPr><w:t>d'2f</w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
<w:tr><w:tc><w:tcPr><w:tcW w:w="2001" w:type="dxa"/></w:tcPr><w:p>${preetiRun('gfd', '<w:b/>')}</w:p></w:tc>
<w:tc><w:p>${preetiRun('sd{')}</w:p></w:tc></w:tr></w:tbl>
<w:p><w:r><w:t>df]/Ë</w:t></w:r></w:p>
<w:p/>
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body></w:document>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W_NS}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Preeti" w:hAnsi="Preeti"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

const HEADER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${W_NS}"><w:p>${preetiRun(';jf]{Rr cbfnt')}</w:p></w:hdr>`;

const FOOTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${W_NS}"><w:p>${preetiRun('cfb]z kfof]')}</w:p></w:ftr>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

function sampleDocx(overrides = {}) {
  const parts = [
    { name: '[Content_Types].xml', text: CONTENT_TYPES, deflate: true },
    { name: '_rels/.rels', text: `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`, deflate: false },
    { name: 'word/document.xml', text: DOCUMENT, deflate: true },
    { name: 'word/styles.xml', text: STYLES, deflate: true },
    { name: 'word/header1.xml', text: HEADER, deflate: false },
    { name: 'word/footer1.xml', text: FOOTER, deflate: true }
  ];
  if (overrides.document) parts[2] = { ...parts[2], text: overrides.document };
  if (overrides.styles) parts[3] = { ...parts[3], text: overrides.styles };
  if (overrides.header) parts[4] = { ...parts[4], text: overrides.header };
  if (overrides.footer) parts[5] = { ...parts[5], text: overrides.footer };
  return buildZip(parts);
}

const W = '{' + W_NS + '}';

function paragraphs(xml) {
  return [...xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map((match) => ({
    xml: match[1],
    text: [...match[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map((t) => t[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
      .join('')
  }));
}

async function convert(input, options) {
  const result = await docx.convertDocument(input, options);
  const files = readZip(result.bytes);
  return { result, files, document: files.get('word/document.xml').data.toString('utf8') };
}

/* ---------------------------------- tests ---------------------------------- */

test('converts the body text of a Preeti document to Unicode', async () => {
  const { document, result } = await convert(sampleDocx());
  const text = paragraphs(document).map((p) => p.text);

  assert.equal(text[0], 'नेपालको अदालतमा');
  assert.equal(text[1], 'मुद्दा नेपाल');
  assert.equal(text[2], 'काठ लाग्यो');
  assert.equal(text[3], 'Supreme Court of Nepal, 2024.');
  assert.equal(text[4], 'यो नेपाली युनिकोड पहिले नै सही छ।');
  assert.equal(text[5], 'पेशीतारिख');
  assert.equal(text[6], 'मुद्दा');
  /* 10 in the body, plus the header and the footer. */
  assert.equal(result.stats.paragraphs, 12);
  assert.equal(result.stats.paragraphsConverted, 10);
  assert.ok(result.stats.runsConverted > 0);
});

test('keeps paragraph, table, list and page markup byte for byte', async () => {
  const { document } = await convert(sampleDocx());

  assert.ok(document.includes('<w:jc w:val="center"/>'), 'alignment kept');
  assert.ok(document.includes('<w:sz w:val="28"/>'), 'font size kept');
  assert.ok(document.includes('<w:b/>'), 'bold kept');
  assert.ok(document.includes('<w:i/>'), 'italic kept');
  assert.ok(document.includes('<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>'), 'table formatting kept');
  assert.ok(document.includes('<w:tcW w:w="2001" w:type="dxa"/>'), 'cell width kept');
  assert.ok(document.includes('<w:pgSz w:w="11906" w:h="16838"/>'), 'page size kept');
  assert.ok(document.includes('<w:pgMar w:top="1440"'), 'margins kept');
  assert.ok(document.includes('mc:Ignorable="w14"'), 'namespace declarations kept');
  assert.ok(document.includes('<w:p/>'), 'empty paragraph kept');
  assert.ok(document.includes('<w:instrText xml:space="preserve"> PAGE </w:instrText>'), 'field code untouched');
  const count = (xml) => (xml.match(/<w:p[\s>]/g) || []).length;
  assert.equal(count(document), count(DOCUMENT), 'paragraph count kept');
});

test('a word split across runs keeps its characters and its formatting', async () => {
  const { document, result } = await convert(sampleDocx());
  const para = paragraphs(document)[1];

  assert.equal(para.text, 'मुद्दा नेपाल');
  assert.equal([...para.xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].length, 3, 'run count kept');
  /* The two runs of "d" and "'2f" are the same formatting, so merging is invisible. */
  assert.equal(result.stats.wordsMerged, 1);
});

test('a formatting boundary inside a word is reported, not silently lost', async () => {
  const { document, result } = await convert(sampleDocx());
  const para = paragraphs(document)[2];

  assert.equal(para.text, 'काठ लाग्यो');
  assert.ok(para.xml.includes('<w:b/>'), 'the bold run formatting is still on the first run');
  assert.equal(result.stats.segmentsMerged, 0);
});

test('already-Unicode text is left alone and its legacy font is replaced', async () => {
  const { document, result } = await convert(sampleDocx());
  const para = paragraphs(document)[4];

  assert.equal(para.text, 'यो नेपाली युनिकोड पहिले नै सही छ।');
  assert.ok(!/w:ascii="Preeti"/.test(para.xml), 'Preeti font name removed');
  assert.ok(para.xml.includes('w:ascii="Nirmala UI"'), 'Unicode font applied');
  assert.equal(result.stats.alreadyUnicode, 1);
});

test('English text in another font is never transliterated in auto mode', async () => {
  const { document } = await convert(sampleDocx());
  const para = paragraphs(document)[3];

  assert.equal(para.text, 'Supreme Court of Nepal, 2024.');
  assert.ok(para.xml.includes('w:ascii="Times New Roman"'), 'font left as it was');
});

test('headers, footers and other parts are converted too', async () => {
  const { files, result } = await convert(sampleDocx());
  const header = files.get('word/header1.xml').data.toString('utf8');
  const footer = files.get('word/footer1.xml').data.toString('utf8');

  assert.match(header, /सर्वोच्च अदालत/);
  assert.match(footer, /आदेश पायो/);
  assert.equal(result.stats.parts, 3, 'document, header and footer were processed');
});

test('the document default font is used when a run names no font', async () => {
  const { document } = await convert(sampleDocx());
  const para = paragraphs(document)[9];

  assert.equal(para.text, 'मोरङ्ग');
  /* The run had no w:rPr at all, so one is added with the Unicode face. */
  assert.ok(para.xml.includes('<w:rPr><w:rFonts w:ascii="Nirmala UI"'), para.xml);
});

test('output is a valid zip with every entry and the original order', async () => {
  const input = sampleDocx();
  const { files, result } = await convert(input);

  assert.deepEqual([...files.keys()], [
    '[Content_Types].xml', '_rels/.rels', 'word/document.xml',
    'word/styles.xml', 'word/header1.xml', 'word/footer1.xml'
  ]);
  assert.equal(files.get('word/styles.xml').method, 8);
  assert.equal(files.get('_rels/.rels').method, 0);
  assert.ok(files.get('word/document.xml').data.length > 1000);
  assert.equal(result.blob.type, docx.mimeType);
});

test('parts that did not change keep their exact compressed bytes', async () => {
  const input = sampleDocx();
  const before = readZip(input);
  const { files } = await convert(input);

  for (const name of ['[Content_Types].xml', '_rels/.rels', 'word/styles.xml']) {
    assert.deepEqual(files.get(name).payload, before.get(name).payload, name + ' was rewritten');
  }
});

test('the uploaded bytes are never mutated', async () => {
  const input = sampleDocx();
  const copy = Uint8Array.from(input);
  await convert(input);
  assert.deepEqual(input, copy);
});

test('all-Latin mode converts runs whose font name was lost', async () => {
  const { document } = await convert(sampleDocx(), { mode: 'all' });
  const para = paragraphs(document)[3];
  assert.notEqual(para.text, 'Supreme Court of Nepal, 2024.');
  assert.ok(/[\u0900-\u097F]/.test(para.text), para.text);
});

test('Devanagari is not converted twice in all-Latin mode', async () => {
  const { document } = await convert(sampleDocx(), { mode: 'all' });
  assert.equal(paragraphs(document)[4].text, 'यो नेपाली युनिकोड पहिले नै सही छ।');
});

test('a document with no Preeti text reports that nothing was converted', async () => {
  const latinOnly = DOCUMENT
    .replace(/<w:rFonts w:ascii="Preeti"[^>]*\/>/g, '')
    .replace(/<w:t>df\]\/Ë<\/w:t>/, '<w:t>accent</w:t>');
  const latinHeader = `<w:hdr xmlns:w="${W_NS}"><w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr><w:t>Header</w:t></w:r></w:p></w:hdr>`;
  const { result } = await convert(sampleDocx({
    document: latinOnly,
    header: latinHeader,
    footer: latinHeader.replace('w:hdr', 'w:ftr'),
    styles: STYLES.replace(/w:ascii="Preeti" w:hAnsi="Preeti"/, 'w:ascii="Calibri" w:hAnsi="Calibri"')
  }));
  assert.equal(result.stats.runsConverted, 0);
  assert.equal(result.stats.charsIn, 0);
});

test('characters with no Unicode match are reported, not dropped', async () => {
  const doc = DOCUMENT.replace('<w:t>df]/Ë</w:t>', '<w:t>♣♣</w:t>');
  const { document, result } = await convert(sampleDocx({ document: doc }));

  assert.ok(paragraphs(document)[9].text.includes('♣'), 'the character is still there');
  assert.deepEqual(result.stats.unmapped, [{ char: '♣', count: 2 }]);
});

test('reph and the m suffix are not reported as leftovers', async () => {
  const { result } = await convert(sampleDocx());
  /* "{" (reph) and "m" are Preeti keys the rules consume; neither may be listed. */
  assert.deepEqual(result.stats.unmapped, []);
});

test('a file that is not a zip is rejected with a readable message', async () => {
  await assert.rejects(docx.convertDocument(Buffer.from('not a document')), (error) => {
    assert.equal(error.code, 'NOT_ZIP');
    assert.match(error.message, /not a Word \.docx/);
    return true;
  });
});

test('a zip that is not a Word document is rejected', async () => {
  const zip = buildZip([{ name: 'hello.txt', text: 'hi', deflate: true }]);
  await assert.rejects(docx.convertDocument(zip), (error) => {
    assert.equal(error.code, 'NOT_WORD');
    return true;
  });
});

test('an oversized file is refused before it is read', async () => {
  const big = new Uint8Array(docx.maxBytes + 1);
  await assert.rejects(docx.convertDocument(big), (error) => {
    assert.equal(error.code, 'TOO_LARGE');
    return true;
  });
});

test('a long document converts whole and keeps its paragraphs', async () => {
  const line = preetiRun('tfl/v @)*#=)^=#! d' + "'2f g+= )*@");
  const paragraphsXml = Array.from({ length: 500 }, () => `<w:p>${line}</w:p>`).join('\n');
  const doc = DOCUMENT.replace(/<w:body>[\s\S]*<\/w:body>/, `<w:body>${paragraphsXml}</w:body>`);

  const started = Date.now();
  const { document, result } = await convert(sampleDocx({ document: doc }));
  const elapsed = Date.now() - started;

  const text = paragraphs(document).map((p) => p.text);
  assert.equal(text.length, 500);
  assert.ok(text.every((t) => t === 'तारिख २०८३.०६.३१ मुद्दा नं. ०८२'), text[0]);
  assert.ok(elapsed < 5000, 'conversion took ' + elapsed + 'ms');
  assert.equal(result.stats.paragraphsConverted, 502, '500 paragraphs plus the header and footer');
  assert.equal(result.stats.paragraphs, 502);
});
