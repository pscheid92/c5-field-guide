// BSI's change log between C5:2020 and C5:2026 (vendor/bsi/C5_2026_changelog.xlsx).
// One row per C5:2026 criterion, columns by position:
//   A area · B ID C5:2020 ("-" if new, several IDs if merged) · C ID C5:2026 ·
//   D title · E/F basic criteria C5:2020/C5:2026 · G description of changes ·
//   H/I additional criteria C5:2020/C5:2026 · J description of changes
// The texts are BSI's, unchanged. Status is derived from BSI's exact wording
// only: no predecessor → new; both descriptions "No change." (or empty) →
// unchanged; everything else → changed, and the description says how.
import { readWorkbook } from './xlsx.mjs';

// BSI's wording for "nothing changed". Add the German phrase here when the
// announced German change log is wired in, or its unchanged criteria would
// count as changed.
const NO_CHANGE = new Set(['No change.']);

const clean = (s = '') => {
	const text = s.replace(/\r\n?/g, '\n').trim();
	return text === '-' ? '' : text;
};

export function loadChangelog(file, ids) {
	const [info, history] = readWorkbook(file);
	const [header, ...rows] = history?.rows ?? [];
	if (!/2020/.test(header?.B ?? '') || !/2026/.test(header?.C ?? '')) {
		throw new Error(`${file}: expected the C5:2020 ID in column B and the C5:2026 ID in column C`);
	}
	const byId = new Map();
	for (const row of rows) {
		const id = clean(row.C);
		if (!id) continue;
		if (byId.has(id)) throw new Error(`${file}: ${id} listed twice`);
		const notes = { basic: clean(row.G), additional: clean(row.J) };
		const old = clean(row.B).split(/\s+/).filter(Boolean);
		byId.set(id, {
			status: old.length === 0 ? 'new' : Object.values(notes).every((n) => !n || NO_CHANGE.has(n)) ? 'unchanged' : 'changed',
			old,
			notes,
			previous: { basic: clean(row.E), additional: clean(row.H) },
		});
	}
	const missing = ids.filter((id) => !byId.has(id));
	const unknown = [...byId.keys()].filter((id) => !ids.includes(id));
	if (missing.length || unknown.length) {
		throw new Error(`${file} does not match the catalogue. Missing: ${missing.join(', ') || '–'}. Unknown: ${unknown.join(', ') || '–'}.`);
	}
	// BSI's own statement of what the log compares, e.g. "This change log is
	// based on the BSI C5:2020 and version 1.0.0 of the BSI C5:2026."
	const basis = (info?.rows ?? []).slice(1).flatMap((r) => Object.values(r)).map(clean).filter(Boolean).join(' ');
	return { basis, byId };
}
