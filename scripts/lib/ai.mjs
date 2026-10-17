// Content Claude derived from the BSI text (data/ai/*.yml), checked against
// that text so it cannot drift from it. Shared by the values page and the topic
// pages. The rules:
// - Every quote must appear verbatim in the cited sub-criterion, in its text
//   or in BSI's supplementary information for it (the two editions sometimes
//   put a sentence in different places). Whitespace and list markers ("1.",
//   "-") are ignored; the site renders those as formatting.
// - A value ("48 Stunden") must appear in its own quote, so a number can never
//   sit next to a quote that says something else.
// Any violation fails the build.
import fs from 'node:fs';
import yaml from 'js-yaml';

export const normalise = (text) =>
	text
		.replace(/^\s*(?:\d+\.|[-•–])\s+/gm, '')
		.replace(/\s+/g, ' ')
		.replace(/\s+([).,;:])/g, '$1')
		.trim();

const dateOf = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''));

// The values page is ordered by time: three groups, by the `type` of a value.
const GROUPS = {
	deadline: {
		id: { de: 'fristen', en: 'deadlines' },
		title: { de: 'Fristen', en: 'Deadlines' },
		lead: { de: 'Wie lange etwas höchstens dauern oder gültig sein darf, die kürzeste Frist zuerst.', en: 'How long something may take or stay valid at most, shortest first.' },
	},
	interval: {
		id: { de: 'intervalle', en: 'intervals' },
		title: { de: 'Intervalle', en: 'Intervals' },
		lead: { de: 'Was regelmäßig wiederholt werden muss, nach Takt geordnet.', en: 'What has to be repeated regularly, by cadence.' },
	},
	limit: {
		id: { de: 'grenzwerte', en: 'limits' },
		title: { de: 'Grenzwerte', en: 'Limits' },
		lead: { de: 'Mindestwerte für Standorte, Gebäude, Versorgung und Personal.', en: 'Minimums for sites, buildings, supply and staff.' },
	},
};
// Intervals group by cadence, in days as read from the German value.
const CADENCES = [
	{ days: 1, id: { de: 'taeglich', en: 'daily' }, title: { de: 'Täglich', en: 'Daily' } },
	{ days: 30, id: { de: 'monatlich', en: 'monthly' }, title: { de: 'Monatlich', en: 'Monthly' } },
	{ days: 90, id: { de: 'quartalsweise', en: 'quarterly' }, title: { de: 'Quartalsweise', en: 'Quarterly' } },
	{ days: 180, id: { de: 'halbjaehrlich', en: 'every-six-months' }, title: { de: 'Halbjährlich', en: 'Every six months' } },
	{ days: 365, id: { de: 'jaehrlich', en: 'annually' }, title: { de: 'Jährlich', en: 'Annually' } },
	{ days: 730, id: { de: 'alle-zwei-jahre', en: 'every-two-years' }, title: { de: 'Alle zwei Jahre', en: 'Every two years' } },
	{ days: 1095, id: { de: 'alle-drei-jahre', en: 'every-three-years' }, title: { de: 'Alle drei Jahre', en: 'Every three years' } },
];
const WORDS = { täglich: 1, monatlich: 30, quartalsweise: 90, jährlich: 365 };
const UNITS = { Stunde: 1 / 24, Stunden: 1 / 24, Tag: 1, Tage: 1, Monat: 30, Monate: 30, Jahr: 365, Jahre: 365 };
// "48 Stunden" → 2, "jährlich" → 365; a range ("24 Stunden bis 1 Monat") sorts
// by its start. null if the value is not a time.
const days = (value) => {
	if (value in WORDS) return WORDS[value];
	const m = value.match(/^(\d+) (\p{L}+)/u);
	return m && m[2] in UNITS ? Number(m[1]) * UNITS[m[2]] : null;
};

/**
 * The values page: concrete deadlines, intervals and limits, ordered by time.
 * `sub(id)` returns a sub-criterion ("IAM-04.02B") of this language as
 * { text, info: [text], kind, url } or undefined.
 */
export function loadValues(file, lang, sub) {
	const data = yaml.load(fs.readFileSync(file, 'utf8'));
	const errors = [];
	const sections = (data.sections ?? []).map((section) => ({
		id: section.id,
		title: section.title[lang],
		values: (section.values ?? []).map((v, i) => {
			const where = `${section.id}[${i}] ${v.sub}`;
			const target = sub(v.sub);
			const quote = v.quote?.[lang];
			for (const field of ['value', 'label', 'quote']) if (!v[field]?.[lang]) errors.push(`${where}: missing ${lang} ${field}`);
			if (!(v.type in GROUPS)) errors.push(`${where}: type must be one of ${Object.keys(GROUPS).join(', ')}`);
			const time = days(v.value?.de ?? '');
			if (v.type !== 'limit' && time === null) errors.push(`${where}: cannot read "${v.value?.de}" as a time`);
			if (v.type === 'interval' && !CADENCES.some((c) => c.days === time)) errors.push(`${where}: no cadence for "${v.value?.de}"`);
			let inInfo = false;
			if (!target) errors.push(`${where}: unknown sub-criterion (${lang})`);
			else if (quote) {
				const found = (text) => normalise(text).includes(normalise(quote));
				inInfo = !found(target.text) && target.info.some(found);
				if (!found(target.text) && !inInfo) errors.push(`${where}: ${lang} quote not found: "${quote}"`);
				const term = v.term?.[lang] ?? v.value?.[lang] ?? '';
				if (!normalise(quote).toLowerCase().includes(normalise(term).toLowerCase())) {
					errors.push(`${where}: ${lang} value "${term}" does not appear in its quote`);
				}
			}
			return {
				sub: v.sub,
				url: target?.url ?? '',
				kind: target?.kind ?? 'basic',
				inInfo,
				example: Boolean(v.example),
				type: v.type,
				days: time,
				topic: section.title[lang],
				value: v.value?.[lang] ?? '',
				label: v.label?.[lang] ?? '',
				quote: quote ?? '',
			};
		}),
	}));
	if (errors.length) throw new Error(`${file}:\n  ${errors.join('\n  ')}`);
	// Every group lists its values under headings: deadlines and limits under
	// the value itself ("48 Stunden"), intervals under their cadence. File order
	// (section, then entry) breaks ties: sort is stable.
	const all = sections.flatMap((s) => s.values);
	const of = (type) => all.filter((v) => v.type === type);
	const byValue = (list) =>
		list.reduce((buckets, v) => {
			const last = buckets.at(-1);
			if (last?.title === v.value) last.values.push(v);
			else buckets.push({ title: v.value, values: [v] });
			return buckets;
		}, []);
	const group = (type, buckets) => ({
		id: GROUPS[type].id[lang],
		title: GROUPS[type].title[lang],
		lead: GROUPS[type].lead[lang],
		count: of(type).length,
		buckets,
	});
	return {
		generated: dateOf(data.generated),
		count: all.length,
		additional: all.filter((v) => v.kind !== 'basic').length,
		groups: [
			group('deadline', byValue(of('deadline').sort((a, b) => a.days - b.days))),
			group(
				'interval',
				CADENCES.map((c) => ({ id: c.id[lang], title: c.title[lang], values: of('interval').filter((v) => v.days === c.days) })).filter((c) => c.values.length),
			),
			group('limit', byValue(of('limit'))),
		],
	};
}

/**
 * The topic pages: criteria by technical area. `criteria` is this language's
 * catalogue (in catalogue order), `domainTitle(code)` its domain titles and
 * `urlFor(id)` / `anchorFor(id, sub)` its addresses.
 */
export function loadTopics(file, lang, { criteria, domainTitle, urlFor, anchorFor }) {
	const data = yaml.load(fs.readFileSync(file, 'utf8'));
	const errors = [];
	const byId = new Map(criteria.map((c, i) => [c.id, { ...c, order: i }]));
	const topics = (data.topics ?? []).map((topic) => {
		for (const field of ['name', 'intro']) if (!topic[field]?.[lang]) errors.push(`${topic.id}: missing ${lang} ${field}`);
		const seen = new Set();
		const entries = (topic.criteria ?? [])
			.map((entry) => {
				const id = typeof entry === 'string' ? entry : entry.id;
				const c = byId.get(id);
				if (!c) return errors.push(`${topic.id}: unknown criterion ${id}`), null;
				if (seen.has(id)) errors.push(`${topic.id}: ${id} listed twice`);
				seen.add(id);
				const only = typeof entry === 'string' ? null : (entry.subs ?? []).map(String);
				for (const s of only ?? []) if (!c.subs.some((x) => x.id === s)) errors.push(`${topic.id}: ${id} has no sub-criterion ${s} (${lang})`);
				const subs = only ? c.subs.filter((s) => only.includes(s.id)) : c.subs;
				return {
					id,
					name: c.name,
					domain: c.domain,
					order: c.order,
					url: only ? `${urlFor(id)}#${anchorFor(id, subs[0]?.id ?? '')}` : urlFor(id),
					partial: Boolean(only),
					subsTotal: c.subs.length,
					basic: c.subs.filter((s) => s.kind === 'basic').length,
					subs: subs.map((s) => s.id),
				};
			})
			.filter(Boolean)
			.sort((a, b) => a.order - b.order);
		const codes = [...new Set(entries.map((e) => e.domain))];
		if (codes.length < 3) errors.push(`${topic.id}: draws from ${codes.length} domains, the rule is at least 3`);
		return {
			id: topic.id,
			slug: topic.slug[lang],
			slugs: topic.slug,
			name: topic.name?.[lang] ?? '',
			intro: topic.intro?.[lang] ?? '',
			criteriaCount: entries.length,
			domains: codes.map((code) => ({ code, title: domainTitle(code), criteria: entries.filter((e) => e.domain === code) })),
		};
	});
	if (errors.length) throw new Error(`${file}:\n  ${errors.join('\n  ')}`);
	return { generated: dateOf(data.generated), topics };
}
