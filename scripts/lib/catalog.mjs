// Loads BSI's machine-readable C5 catalogue (one YAML file per domain) into a
// normalised in-memory model. The BSI text itself is never modified here.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const SUB_KINDS = [
	{ key: 'basic', kind: 'basic' },
	{ key: 'additional_sharpen', kind: 'sharpen' },
	{ key: 'additional_complement', kind: 'complement' },
];

// BSI's AM.yml repeats the `information:` key for AM-07 (first empty, then
// populated). `json: true` makes js-yaml keep the last value instead of failing;
// assertions below make sure nothing ended up empty that shouldn't be.
function loadYaml(file) {
	return yaml.load(fs.readFileSync(file, 'utf8'), { json: true });
}

const str = (v) => (v == null ? '' : String(v));

export function loadCatalog(dir, domains) {
	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yml'));
	const versionFile = files.find((f) => /^version/i.test(f));
	if (!versionFile) throw new Error(`no version file in ${dir}`);
	const meta = loadYaml(path.join(dir, versionFile));

	const criteria = [];
	const conditions = [];

	for (const file of files.sort()) {
		if (file === versionFile) continue;
		const code = path.basename(file, '.yml');
		const data = loadYaml(path.join(dir, file));
		if (!Array.isArray(data)) throw new Error(`${file}: expected a list`);

		if (code === 'GC') {
			for (const c of data) {
				conditions.push({ id: str(c.id), name: str(c.name), condition: str(c.condition), hint: str(c.hint) });
			}
			continue;
		}

		if (!domains[code]) throw new Error(`${file}: domain ${code} missing from data/domains.yml`);

		for (const c of data) {
			const id = `${code}-${str(c.identifier)}`;
			const subs = [];
			for (const { key, kind } of SUB_KINDS) {
				for (const s of c[key] || []) {
					subs.push({
						id: str(s.identifier),
						kind,
						text: str(s.criterion),
						sharpens: s.sharpened_basic_criterion ? str(s.sharpened_basic_criterion) : null,
					});
				}
			}
			if (!subs.some((s) => s.kind === 'basic')) throw new Error(`${id}: no basic sub-criteria`);

			// applicable_criteria are YAML aliases that resolve to sub-criterion ids
			// like '01B'. They are only unique within one criterion.
			const subIds = new Set(subs.map((s) => s.id));
			const information = (c.information || []).map((i) => {
				const appliesTo = (i.applicable_criteria || []).map(str);
				for (const a of appliesTo) {
					if (!subIds.has(a)) throw new Error(`${id}: information refers to unknown sub-criterion ${a}`);
				}
				return { appliesTo, text: str(i.information_text) };
			});

			criteria.push({
				id,
				domain: code,
				number: str(c.identifier),
				name: str(c.name),
				subs,
				information,
				corresponding: str(c.corresponding),
			});
		}
	}

	const am07 = criteria.find((c) => c.id === 'AM-07');
	if (am07 && am07.information.length === 0) throw new Error('AM-07: duplicate-key workaround lost the information block');

	criteria.sort((a, b) => domains[a.domain].order - domains[b.domain].order || a.number.localeCompare(b.number));
	return { meta, criteria, conditions };
}

export function loadDomains(file) {
	const list = loadYaml(file);
	return Object.fromEntries(list.map((d, i) => [d.code, { ...d, order: i }]));
}

// Finds references such as "cf. OPS-26" or "SP-01" in BSI text. Anchored on the
// known domain codes so that e.g. PSS-04 never matches as PS-04.
export function findReferences(text, codes, known) {
	const re = new RegExp(`\\b(${codes.join('|')})-(\\d{2})\\b`, 'g');
	const out = new Set();
	for (const m of text.matchAll(re)) {
		const ref = `${m[1]}-${m[2]}`;
		if (known.has(ref)) out.add(ref);
	}
	return out;
}
