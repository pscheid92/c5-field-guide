// BSI's change log between C5:2020 and C5:2026 (vendor/bsi/C5_2026_changelog.xlsx).
// One row per C5:2026 criterion, columns by position:
//   A area · B ID C5:2020 ("-" if new, several IDs if merged) · C ID C5:2026 ·
//   D title · E/F basic criteria C5:2020/C5:2026 · G description of changes ·
//   H/I additional criteria C5:2020/C5:2026 · J description of changes
// The texts are BSI's, unchanged. Status is derived from BSI's exact wording
// only: no predecessor → new; both descriptions "No change." (or empty) →
// unchanged; everything else → changed, and the description says how.
//
// The log compares against version 1.0.0 of C5:2026 (its info sheet says so),
// while the catalogue is a later edition. Criteria BSI renumbered since then
// are mapped in RENUMBERED, and every row is checked against the catalogue
// text, so a row can never be shown on the wrong criterion.
import { readWorkbook } from './xlsx.mjs';

// ID in the change log (C5:2026 v1.0.0) → ID in the catalogue (EN v1.0.1,
// DE v1.1.0). In v1.0.0, IAM-08 was "Confidentiality of Authentication
// Information" (formerly IDM-08) and IAM-09 "Authentication Mechanisms"
// (formerly IDM-09); the later editions swapped them. Remove an entry when BSI
// publishes a change log based on the current edition: the text check below
// then fails until it is removed.
const RENUMBERED = { 'IAM-08': 'IAM-09', 'IAM-09': 'IAM-08' };

// BSI's wording for "nothing changed". Add the German phrase here when the
// announced German change log is wired in, or its unchanged criteria would
// count as changed.
const NO_CHANGE = new Set(['No change.']);

const clean = (s = '') => {
	const text = s.replace(/\r\n?/g, '\n').trim();
	return text === '-' ? '' : text;
};

// How much of the shorter text's vocabulary the longer one shares (0–1).
// Rewording between editions keeps most of a criterion's words; another
// criterion shares far fewer.
const words = (text) => new Set(text.toLowerCase().match(/\p{L}{4,}/gu) ?? []);
const overlap = (a, b) => {
	const [x, y] = [words(a), words(b)];
	let shared = 0;
	for (const w of x) if (y.has(w)) shared++;
	return shared / Math.max(1, Math.min(x.size, y.size));
};

/**
 * `criteria` is the catalogue in the log's language ({ id, subs: [{ kind,
 * text }] }); its basic sub-criteria are what the log's 2026 column describes.
 */
export function loadChangelog(file, criteria) {
	const ids = criteria.map((c) => c.id);
	const basicText = new Map(criteria.map((c) => [c.id, c.subs.filter((s) => s.kind === 'basic').map((s) => s.text).join(' ')]));
	const [info, history] = readWorkbook(file);
	const [header, ...rows] = history?.rows ?? [];
	if (!/2020/.test(header?.B ?? '') || !/2026/.test(header?.C ?? '')) {
		throw new Error(`${file}: expected the C5:2020 ID in column B and the C5:2026 ID in column C`);
	}
	const byId = new Map();
	const misplaced = [];
	for (const row of rows) {
		const logged = clean(row.C);
		if (!logged) continue;
		const id = RENUMBERED[logged] ?? logged;
		// The row's 2026 basic text must fit its criterion better than any other.
		const text = clean(row.F);
		if (text && basicText.has(id)) {
			const own = overlap(text, basicText.get(id));
			const [bestId, best] = [...basicText].map(([other, t]) => [other, overlap(text, t)]).sort((a, b) => b[1] - a[1])[0];
			if (bestId !== id && best > own) {
				misplaced.push(`row ${logged}${id !== logged ? ` (mapped to ${id})` : ''} "${clean(row.D)}" fits ${bestId} (${best.toFixed(2)}) better than ${id} (${own.toFixed(2)})`);
			}
		}
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
	if (misplaced.length) {
		throw new Error(`${file}: rows do not fit the catalogue text; check RENUMBERED in scripts/lib/changelog.mjs.\n  ${misplaced.join('\n  ')}`);
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
