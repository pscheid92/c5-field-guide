// Minimal reader for BSI's .xlsx files, without dependencies: unzips with
// node:zlib and returns every worksheet as rows of { A: text, B: text, … }.
// Enough for plain tables of shared or inline strings; no formulas, dates or
// styles.
import fs from 'node:fs';
import zlib from 'node:zlib';

function unzip(file) {
	const buf = fs.readFileSync(file);
	// The central directory is listed in the "end of central directory" record,
	// the last occurrence of its signature in the file.
	let end = buf.length - 22;
	while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
	if (end < 0) throw new Error(`${file}: not a zip file`);
	const files = new Map();
	let p = buf.readUInt32LE(end + 16);
	for (let i = buf.readUInt16LE(end + 10); i > 0; i--) {
		if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`${file}: broken central directory`);
		const method = buf.readUInt16LE(p + 10);
		const size = buf.readUInt32LE(p + 20);
		const nameLength = buf.readUInt16LE(p + 28);
		const name = buf.toString('utf8', p + 46, p + 46 + nameLength);
		const header = buf.readUInt32LE(p + 42);
		const start = header + 30 + buf.readUInt16LE(header + 26) + buf.readUInt16LE(header + 28);
		const data = buf.subarray(start, start + size);
		if (method !== 0 && method !== 8) throw new Error(`${file}: ${name} uses unsupported compression ${method}`);
		files.set(name, method === 8 ? zlib.inflateRawSync(data) : data);
		p += 46 + nameLength + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
	}
	return files;
}

const unescape = (s) =>
	s
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, '&')
		// Excel's own escape for control characters, e.g. _x000D_ for "\r".
		.replace(/_x([0-9a-f]{4})_/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

// Text of a string item: all <t> runs, without phonetic hints (<rPh>).
const textOf = (xml) =>
	[...xml.replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescape(m[1])).join('');

/** All worksheets in workbook order: [{ name, rows: [{ A: '…', B: '…' }, …] }]. */
export function readWorkbook(file) {
	const files = unzip(file);
	const xml = (name) => {
		const data = files.get(name);
		if (!data) throw new Error(`${file}: ${name} missing`);
		return data.toString('utf8');
	};
	const shared = files.has('xl/sharedStrings.xml') ? [...xml('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : [];
	const targets = new Map(
		[...xml('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\s[^>]*>/g)].map((m) => [
			m[0].match(/\sId="([^"]+)"/)[1],
			m[0].match(/\sTarget="([^"]+)"/)[1].replace(/^\/?(xl\/)?/, 'xl/'),
		]),
	);
	return [...xml('xl/workbook.xml').matchAll(/<sheet\s[^>]*>/g)].map((m) => {
		const name = unescape(m[0].match(/\sname="([^"]*)"/)[1]);
		const target = targets.get(m[0].match(/\sr:id="([^"]+)"/)[1]);
		const rows = [...xml(target).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((row) =>
			Object.fromEntries(
				[...row[1].matchAll(/<c\s+r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(([, col, attrs, body = '']) => {
					const type = attrs.match(/\st="([^"]+)"/)?.[1];
					const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
					const text = type === 's' ? shared[Number(value)] : type === 'inlineStr' ? textOf(body) : unescape(value);
					return [col, text ?? ''];
				}),
			),
		);
		return { name, rows };
	});
}
