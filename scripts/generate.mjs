// Turns BSI's machine-readable C5 catalogue into the data the site renders,
// once per language. Run before `astro dev` / `astro build` (see package.json).
//
// Inputs (per language <lang> = de | en):
//   vendor/bsi/<lang>/C5_2026_Machine-Readable_<lang>/*.yml   BSI catalogue (unchanged)
//   data/domains.yml                                          domain titles + order
// Outputs (generated, not committed):
//   src/generated/catalog.<lang>.json   criteria with rendered BSI text, references
//   src/generated/search.<lang>.json    plain-text search index
//
// German is served at the site root, English under /en/. URLs: /iam/ (domain),
// /iam-06/ (criterion), /iam-06/#iam-06-02b (sub-criterion), /gc-01/ (general
// condition). The two BSI editions have different versions (DE 1.1.0, EN 1.0.1)
// and are not guaranteed to match sub-criterion for sub-criterion, so each
// language is generated from its own source; only criterion IDs are shared.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, loadDomains, findReferences } from './lib/catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);

const domains = loadDomains(r('data/domains.yml'));
const codes = Object.keys(domains).sort((a, b) => b.length - a.length);

const LOCALES = {
	de: {
		prefix: '',
		bsiDir: r('vendor/bsi/de/C5_2026_Machine-Readable_de'),
		domainTitle: (d) => d.title_de,
		sourceUrl:
			'https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Empfehlungen-nach-Angriffszielen/Cloud-Computing/Kriterienkatalog-C5/C5_2025/C5_2025_node.html',
		gcTitle: 'Rahmenbedingungen',
		gcNote:
			'Getrennt von den Kriterien aufgeführt. Die Rahmenbedingungen (GC) beschreiben Angaben, die der Cloud-Anbieter in seiner Systembeschreibung und seinen vertraglichen Vereinbarungen macht.',
		attribution: (v, url) =>
			`Kriterientext, ergänzende Informationen und korrespondierende Kriterien für Kunden: ` +
			`BSI C5:2026 (maschinenlesbare Fassung v${v}), ` +
			`© Bundesamt für Sicherheit in der Informationstechnik (BSI) 2026, unverändert wiedergegeben unter ` +
			`<a href="https://creativecommons.org/licenses/by-nd/4.0/deed.de">CC BY-ND 4.0</a>. ` +
			`Formatierung und Querverweis-Links ergänzt. Diese Website steht in keiner Verbindung zum BSI und wird nicht vom BSI unterstützt. ` +
			`<a href="${url}">Offizielle Quelle</a>.`,
	},
	en: {
		prefix: '/en',
		bsiDir: r('vendor/bsi/en/C5_2026_Machine-Readable_en'),
		domainTitle: (d) => d.title,
		sourceUrl:
			'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Empfehlungen-nach-Angriffszielen/Cloud-Computing/Kriterienkatalog-C5/C5_2025/C5_2025_node.html',
		gcTitle: 'General Conditions',
		gcNote:
			'Listed separately from the criteria. General Conditions (GC) describe information the cloud service provider discloses in its system description and contractual agreements.',
		attribution: (v, url) =>
			`Criterion text, supplementary information and complementary customer criteria: ` +
			`BSI C5:2026 (machine-readable edition v${v}), ` +
			`© Federal Office for Information Security (BSI) 2026, reproduced unchanged under ` +
			`<a href="https://creativecommons.org/licenses/by-nd/4.0/">CC BY-ND 4.0</a>. ` +
			`Formatting and cross-reference links added. This site is not affiliated with or endorsed by BSI. ` +
			`<a href="${url}">Official source</a>.`,
	},
};

// ---------------------------------------------------------------- helpers

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (id) => id.toLowerCase();
const anchorFor = (critId, subId) => `${slug(critId)}-${subId.toLowerCase()}`;
const plain = (text) => text.replace(/\s+/g, ' ').trim();

// Files are only rewritten when their content changes, and stale files are
// removed afterwards, so a running `astro dev` picks up changes cleanly.
const produced = new Set();
function write(file, content) {
	produced.add(file);
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}
function pruneStale(dir) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			pruneStale(p);
			if (fs.readdirSync(p).length === 0) fs.rmdirSync(p);
		} else if (!produced.has(p)) {
			fs.rmSync(p);
		}
	}
}

// ---------------------------------------------------------------- load

const catalogs = {};
for (const [lang, loc] of Object.entries(LOCALES)) {
	const cat = loadCatalog(loc.bsiDir, domains);
	cat.byId = new Map(cat.criteria.map((c) => [c.id, c]));
	catalogs[lang] = cat;
}
const [first, ...rest] = Object.values(catalogs);
for (const other of rest) {
	if (first.criteria.map((c) => c.id).join() !== other.criteria.map((c) => c.id).join()) {
		throw new Error('criterion IDs differ between languages');
	}
}

// ---------------------------------------------------------------- per language

function generate(lang) {
	const loc = LOCALES[lang];
	const { meta, criteria, conditions, byId } = catalogs[lang];
	const urlFor = (id) => `${loc.prefix}/${slug(id)}/`;

	const linkRefs = (html) => {
		const re = new RegExp(`\\b(${codes.join('|')})-(\\d{2})\\b`, 'g');
		return html.replace(re, (m) => (byId.has(m) ? `<a href="${urlFor(m)}">${m}</a>` : m));
	};

	// BSI text arrives as paragraphs separated by newlines, with enumerations as
	// lines starting "1.", "2.", ... (and, rarely, "- "). We only change the
	// presentation: paragraphs become <p>, consecutive numbered lines one <ol>,
	// consecutive dash lines one <ul>. Wording is untouched.
	const bsiHtml = (text) => {
		const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
		let out = '';
		let list = null;
		const flush = () => {
			if (list?.type === 'ol') out += `<ol start="${list.start}">${list.items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
			if (list?.type === 'ul') out += `<ul>${list.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
			list = null;
		};
		for (const line of lines) {
			const numbered = line.match(/^(\d+)\.\s+(.*)$/);
			const dashed = line.match(/^[-•–]\s+(.*)$/);
			if (numbered) {
				if (list?.type !== 'ol') {
					flush();
					list = { type: 'ol', start: Number(numbered[1]), items: [] };
				}
				list.items.push(linkRefs(esc(numbered[2])));
			} else if (dashed) {
				if (list?.type !== 'ul') {
					flush();
					list = { type: 'ul', items: [] };
				}
				list.items.push(linkRefs(esc(dashed[1])));
			} else {
				flush();
				out += `<p>${linkRefs(esc(line))}</p>`;
			}
		}
		flush();
		return out;
	};

	// References between criteria, in both directions.
	const outgoing = new Map();
	const incoming = new Map(criteria.map((c) => [c.id, new Set()]));
	for (const c of criteria) {
		const all = [c.name, c.corresponding, ...c.subs.map((s) => s.text), ...c.information.map((i) => i.text)].join('\n');
		const refs = findReferences(all, codes, byId);
		refs.delete(c.id);
		outgoing.set(c.id, refs);
		for (const ref of refs) incoming.get(ref).add(c.id);
	}
	const sortIds = (ids) => [...ids].sort((a, b) => criteria.indexOf(byId.get(a)) - criteria.indexOf(byId.get(b)));

	write(
		r('src/generated', `catalog.${lang}.json`),
		JSON.stringify({
			lang,
			version: meta.version,
			attribution: loc.attribution(esc(String(meta.version)), loc.sourceUrl),
			domains: Object.values(domains).map((d) => ({
				code: d.code,
				title: loc.domainTitle(d),
				count: criteria.filter((c) => c.domain === d.code).length,
			})),
			conditions: {
				title: loc.gcTitle,
				note: loc.gcNote,
				items: conditions.map((g) => ({
					id: g.id,
					name: g.name,
					url: urlFor(g.id),
					conditionHtml: bsiHtml(g.condition),
					hintHtml: g.hint ? bsiHtml(g.hint) : '',
				})),
			},
			criteria: criteria.map((c) => {
				// Supplementary information that covers every sub-criterion is shown
				// once at the top; everything else under the sub-criteria it explains.
				const general = c.subs.length > 1 ? c.information.filter((i) => i.appliesTo.length === c.subs.length) : [];
				return {
					id: c.id,
					domain: c.domain,
					number: c.number,
					name: c.name,
					url: urlFor(c.id),
					generalInfo: general.map((i) => bsiHtml(i.text)),
					subs: c.subs.map((s) => ({
						id: s.id,
						kind: s.kind,
						sharpens: s.sharpens,
						anchor: anchorFor(c.id, s.id),
						html: bsiHtml(s.text),
						info: c.information
							.filter((i) => !general.includes(i) && i.appliesTo.includes(s.id))
							.map((i) => ({ also: i.appliesTo.filter((a) => a !== s.id), html: bsiHtml(i.text) })),
					})),
					customerHtml: c.corresponding ? bsiHtml(c.corresponding) : '',
					related: { out: sortIds(outgoing.get(c.id)), in: sortIds(incoming.get(c.id)) },
				};
			}),
		}),
	);

	write(
		r('src/generated', `search.${lang}.json`),
		JSON.stringify(
			criteria.map((c) => ({
				id: c.id,
				name: c.name,
				domain: c.domain,
				url: urlFor(c.id),
				subs: c.subs.map((s) => ({
					id: s.id,
					kind: s.kind,
					anchor: anchorFor(c.id, s.id),
					// Supplementary information counts towards the sub-criterion it explains.
					text: plain([s.text, ...c.information.filter((i) => i.appliesTo.includes(s.id)).map((i) => i.text)].join(' ')),
				})),
				customer: c.corresponding ? plain(c.corresponding) : '',
			})).concat(
				// General Conditions: one block of text each, no sub-criteria.
				conditions.map((g) => ({
					id: g.id,
					name: g.name,
					domain: 'GC',
					url: urlFor(g.id),
					subs: [{ id: '', kind: 'condition', anchor: '', text: plain([g.condition, g.hint].join(' ')) }],
					customer: '',
				})),
			),
		),
	);

	console.log(`[${lang}] ${criteria.length} criteria, ${conditions.length} general conditions (BSI catalogue v${meta.version})`);
}

for (const lang of Object.keys(LOCALES)) generate(lang);
pruneStale(r('src/generated'));
