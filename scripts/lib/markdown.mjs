// Markdown versions of the catalogue for AI tools (llms.txt convention,
// https://llmstxt.org): one file per criterion and General Condition, the
// whole catalogue per language, and the llms.txt index. BSI text is passed
// through unchanged; only line structure becomes Markdown (paragraphs, "1."
// and "-" lists).

const LABELS = {
	de: {
		catalogue: 'BSI C5:2026 Kriterienkatalog (Deutsch)',
		domain: 'Bereich',
		basic: 'Basiskriterium',
		additional: 'Zusatzkriterium',
		kind: { sharpen: 'Zusatz, verschärft', complement: 'Zusatz, erweiternd' },
		info: 'Ergänzende Information',
		infoFor: (ids) => `Ergänzende Information (zu ${ids.join(', ')})`,
		customer: 'Korrespondierende Kriterien für Kunden',
		conditions: 'Rahmenbedingungen (GC)',
		condition: 'Anforderung',
		hint: 'Hinweis',
		since: 'Gegenüber C5:2020',
		status: { new: 'neu in C5:2026', changed: 'geändert', unchanged: 'unverändert' },
		formerly: (ids) => `vorher ${ids.join(', ')}`,
		changes: 'Änderungen gegenüber C5:2020',
		changesNote: 'Aus der BSI C5:2026 Änderungshistorie, die das BSI bisher nur auf Englisch veröffentlicht.',
		page: 'Webseite',
		criteria: (n) => `${n} Kriterien`,
		conditionsCount: (n) => `${n} Angaben`,
		subs: (total, basic) =>
			total === 1 ? '1 Unterkriterium' : `${total} Unterkriterien (${basic} Basis${total > basic ? `, ${total - basic} Zusatz` : ''})`,
		statusInline: { new: 'neu in C5:2026', changed: 'gegenüber C5:2020 geändert', unchanged: 'gegenüber C5:2020 unverändert' },
		withCustomer: 'mit Kundenkriterien',
		changesTitle: 'Änderungen gegenüber C5:2020',
		changesIntro: 'Status jedes Kriteriums laut BSI-Änderungshistorie. Die Änderungshinweise im Einzelnen stehen in der Markdown-Fassung des jeweiligen Kriteriums.',
		customersTitle: 'Korrespondierende Kriterien für Kunden',
		customersIntro: 'Was Cloud-Kunden auf ihrer Seite umsetzen, aus allen Kriterien gesammelt.',
		source: (version) =>
			`Quelle: BSI C5:2026, maschinenlesbare Fassung v${version}, © Bundesamt für Sicherheit in der Informationstechnik (BSI) 2026, unverändert wiedergegeben unter CC BY-ND 4.0 (https://creativecommons.org/licenses/by-nd/4.0/deed.de). Änderungshinweise: BSI C5:2026 Änderungshistorie, © BSI 2026, CC BY-ND 4.0. Inoffizielle Darstellung, ohne Verbindung zum BSI.`,
	},
	en: {
		catalogue: 'BSI C5:2026 criteria catalogue (English)',
		domain: 'Domain',
		basic: 'Basic criterion',
		additional: 'Additional criterion',
		kind: { sharpen: 'additional, sharpens', complement: 'additional, complementing' },
		info: 'Supplementary information',
		infoFor: (ids) => `Supplementary information (on ${ids.join(', ')})`,
		customer: 'Complementary customer criteria',
		conditions: 'General Conditions (GC)',
		condition: 'Condition',
		hint: 'Hint',
		since: 'Since C5:2020',
		status: { new: 'new in C5:2026', changed: 'changed', unchanged: 'unchanged' },
		formerly: (ids) => `formerly ${ids.join(', ')}`,
		changes: 'Changes since C5:2020',
		changesNote: "From BSI's C5:2026 changelog.",
		page: 'Web page',
		criteria: (n) => `${n} criteria`,
		conditionsCount: (n) => `${n} conditions`,
		subs: (total, basic) =>
			total === 1 ? '1 sub-criterion' : `${total} sub-criteria (${basic} basic${total > basic ? `, ${total - basic} additional` : ''})`,
		statusInline: { new: 'new in C5:2026', changed: 'changed since C5:2020', unchanged: 'unchanged since C5:2020' },
		withCustomer: 'with customer criteria',
		changesTitle: 'Changes since C5:2020',
		changesIntro: "Status of every criterion according to BSI's changelog. The change notes themselves are in each criterion's Markdown version.",
		customersTitle: 'Complementary customer criteria',
		customersIntro: 'What cloud service customers implement on their side, collected from all criteria.',
		source: (version) =>
			`Source: BSI C5:2026, machine-readable edition v${version}, © Federal Office for Information Security (BSI) 2026, reproduced unchanged under CC BY-ND 4.0 (https://creativecommons.org/licenses/by-nd/4.0/). Change notes: BSI C5:2026 Changelog, © BSI 2026, CC BY-ND 4.0. Unofficial presentation, not affiliated with BSI.`,
	},
};

/** BSI's line structure as Markdown: paragraphs separated, list lines kept together. */
export function mdText(text) {
	const blocks = [];
	let list = null;
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) {
			list = null;
			continue;
		}
		const numbered = line.match(/^(\d+)\.\s+(.*)$/);
		const dashed = line.match(/^[-•–]\s+(.*)$/);
		if (numbered || dashed) {
			const item = numbered ? `${numbered[1]}. ${numbered[2]}` : `- ${dashed[1]}`;
			if (list) list.push(item);
			else blocks.push((list = [item]));
		} else {
			list = null;
			blocks.push(line);
		}
	}
	return blocks.map((b) => (Array.isArray(b) ? b.join('\n') : b)).join('\n\n');
}

const heading = (level, text) => `${'#'.repeat(level)} ${text}`;

const md = (url) => `${url}index.html.md`;

/**
 * Markdown for one language. `abs(path)` turns a site path into the address
 * written into the files (absolute when the site URL is known). `paths` gives
 * the language's page addresses: domain(code), changes, customers, full, llms.
 */
export function buildMarkdown({ lang, version, criteria, conditions, domainTitle, changelog, urlFor, paths, sourceUrl, abs }) {
	const L = LABELS[lang];
	const domainLine = (code) => `${code} – ${domainTitle(code)}`;

	const criterion = (c, h) => {
		const ch = changelog.byId.get(c.id);
		const before = ch.old.length === 1 && ch.old[0] === c.id ? [] : ch.old;
		const status = L.status[ch.status] + (before.length ? ` (${L.formerly(before)})` : '');
		const out = [
			heading(h, `${c.id} ${c.name}`),
			[`- ${L.domain}: ${domainLine(c.domain)}`, `- ${L.since}: ${status}`, `- ${L.page}: ${abs(urlFor(c.id))}`].join('\n'),
		];
		// Supplementary information that covers every sub-criterion comes once,
		// before them; the rest under the first sub-criterion it applies to.
		const general = c.subs.length > 1 ? c.information.filter((i) => i.appliesTo.length === c.subs.length) : [];
		for (const i of general) out.push(`**${L.info}:**\n\n${mdText(i.text)}`);
		for (const [kind, label] of [
			['basic', L.basic],
			['additional', L.additional],
		]) {
			const subs = c.subs.filter((s) => (kind === 'basic' ? s.kind === 'basic' : s.kind !== 'basic'));
			if (!subs.length) continue;
			out.push(heading(h + 1, label));
			for (const s of subs) {
				const tag = s.kind === 'basic' ? '' : ` (${L.kind[s.kind]}${s.sharpens ? ` ${s.sharpens}` : ''})`;
				out.push(heading(h + 2, `${c.id}.${s.id}${tag}`), mdText(s.text));
				for (const i of c.information.filter((i) => !general.includes(i) && i.appliesTo[0] === s.id)) {
					const label = i.appliesTo.length > 1 ? L.infoFor(i.appliesTo) : L.info;
					out.push(`**${label}:**\n\n${mdText(i.text)}`);
				}
			}
		}
		if (c.corresponding) out.push(heading(h + 1, L.customer), mdText(c.corresponding));
		if (ch.status === 'changed') {
			const notes = [
				[L.basic, ch.notes.basic],
				[L.additional, ch.notes.additional],
			].filter(([, text]) => text);
			out.push(heading(h + 1, L.changes), L.changesNote, ...notes.map(([label, text]) => `**${label}:**\n\n${mdText(text)}`));
		}
		return out.join('\n\n');
	};

	const condition = (g, h) =>
		[
			heading(h, `${g.id} ${g.name}`),
			`- ${L.page}: ${abs(urlFor(g.id))}`,
			heading(h + 1, L.condition),
			mdText(g.condition),
			...(g.hint ? [heading(h + 1, L.hint), mdText(g.hint)] : []),
		].join('\n\n');

	const source = L.source(version);
	const withSource = (text) => `${text}\n\n---\n\n${source}\n`;
	const codes = [...new Set(criteria.map((c) => c.domain))];
	const statusOf = (c, labels = L.status) => {
		const ch = changelog.byId.get(c.id);
		const before = ch.old.length === 1 && ch.old[0] === c.id ? [] : ch.old;
		return labels[ch.status] + (before.length ? ` (${L.formerly(before)})` : '');
	};
	const link = (x) => `[${x.id} ${x.name}](${abs(md(urlFor(x.id)))})`;

	// Domain overviews: every criterion with a line of metadata and a link to
	// its Markdown, so an agent gets from llms.txt to any criterion in two steps.
	const domain = (code) => {
		const list = criteria.filter((c) => c.domain === code);
		const rows = list.map((c) => {
			const basic = c.subs.filter((s) => s.kind === 'basic').length;
			const meta = [L.subs(c.subs.length, basic), c.corresponding ? L.withCustomer : '', statusOf(c, L.statusInline)].filter(Boolean);
			return `- ${link(c)}: ${meta.join(', ')}`;
		});
		return [heading(1, domainLine(code)), `- ${L.page}: ${abs(paths.domain(code))}`, rows.join('\n')].join('\n\n');
	};
	const conditionsPage = () =>
		[heading(1, L.conditions), `- ${L.page}: ${abs(paths.domain('GC'))}`, conditions.map((g) => `- ${link(g)}`).join('\n')].join('\n\n');

	const items = {};
	for (const c of criteria) items[c.id] = withSource(criterion(c, 1));
	for (const g of conditions) items[g.id] = withSource(condition(g, 1));
	for (const code of codes) items[code] = withSource(domain(code));
	items.GC = withSource(conditionsPage());

	const changes = withSource(
		[
			heading(1, L.changesTitle),
			`- ${L.page}: ${abs(paths.changes)}`,
			L.changesIntro,
			...codes.map((code) =>
				[heading(2, domainLine(code)), criteria.filter((c) => c.domain === code).map((c) => `- ${link(c)}: ${statusOf(c)}`).join('\n')].join('\n\n'),
			),
		].join('\n\n'),
	);
	const customers = withSource(
		[
			heading(1, L.customersTitle),
			`- ${L.page}: ${abs(paths.customers)}`,
			L.customersIntro,
			...codes
				.filter((code) => criteria.some((c) => c.domain === code && c.corresponding))
				.map((code) =>
					[
						heading(2, domainLine(code)),
						...criteria
							.filter((c) => c.domain === code && c.corresponding)
							.flatMap((c) => [heading(3, `${c.id} ${c.name}`), mdText(c.corresponding), `- ${L.page}: ${abs(md(urlFor(c.id)))}`]),
					].join('\n\n'),
				),
		].join('\n\n'),
	);

	const parts = [heading(1, L.catalogue), source];
	for (const code of codes) {
		parts.push(heading(1, domainLine(code)), ...criteria.filter((c) => c.domain === code).map((c) => criterion(c, 2)));
	}
	parts.push(heading(1, L.conditions), ...conditions.map((g) => condition(g, 2)));

	const llms = buildLlmsTxt({ lang, version, criteria, conditions, codes, domainLine, paths, sourceUrl, abs });
	return { items, changes, customers, full: `${parts.join('\n\n')}\n`, llms };
}

/**
 * llms.txt for one language (https://llmstxt.org): short enough to read whole,
 * with the detail behind the links. Each language has its own file covering
 * its path (/llms.txt, /en/llms.txt); they point to each other.
 */
function buildLlmsTxt({ lang, version, criteria, conditions, codes, domainLine, paths, sourceUrl, abs }) {
	const count = (code) => criteria.filter((c) => c.domain === code).length;
	const domainList = codes
		.map((code) => `- [${domainLine(code)}](${abs(md(paths.domain(code)))}): ${lang === 'de' ? `${count(code)} Kriterien` : `${count(code)} criteria`}`)
		.concat(
			`- [GC – ${lang === 'de' ? 'Rahmenbedingungen' : 'General Conditions'}](${abs(md(paths.domain('GC')))}): ${
				lang === 'de' ? `${conditions.length} Angaben aus der Systembeschreibung` : `${conditions.length} disclosures in the system description`
			}`,
		)
		.join('\n');
	const example = abs(md(paths.example));
	if (lang === 'de') {
		return `# C5 Field Guide (Deutsch)

> Inoffizielle, navigierbare Fassung des BSI-Kriterienkatalogs C5:2026 (Cloud Computing Compliance Criteria Catalogue). Der Kriterientext ist unverändert vom BSI übernommen (CC BY-ND 4.0), deutsche Fassung v${version}.

English edition: [${abs(paths.otherLlms)}](${abs(paths.otherLlms)})

Hinweise zum Katalog:

- C5:2026 umfasst ${criteria.length} Kriterien in ${codes.length} Bereichen und ${conditions.length} Rahmenbedingungen (GC). Ein Kriterium wie IAM-06 besteht aus Unterkriterien wie IAM-06.02B. Die Endung zeigt die Art: B = Basiskriterium, AS = Zusatzkriterium, das ein Basiskriterium verschärft, AC = Zusatzkriterium, das ergänzt.
- Jede Kriterienseite gibt es als Markdown unter ihrer Adresse plus \`index.html.md\`, z. B. \`${example}\`. Die Markdown-Fassung enthält auch die ergänzenden Informationen des BSI, die korrespondierenden Kriterien für Kunden und die Änderungen gegenüber C5:2020.
- Viele Kriterien hatten in C5:2020 eine andere ID (z. B. IDM-06, heute IAM-06). Die Bereichsübersichten und die Änderungsübersicht nennen die frühere ID.
- Diese Website steht in keiner Verbindung zum BSI. Verbindlich ist der Katalog des BSI: ${sourceUrl}

## Bereiche

${domainList}

## Bereichsübergreifend

- [Änderungen gegenüber C5:2020](${abs(md(paths.changes))}): Status jedes Kriteriums (neu, geändert, unverändert) mit früherer ID
- [Korrespondierende Kriterien für Kunden](${abs(md(paths.customers))}): was Cloud-Kunden selbst umsetzen, aus allen Kriterien gesammelt

## Optional

- [Gesamter Katalog](${abs(paths.full)}): alle Kriterien, ergänzenden Informationen, Kundenkriterien und Rahmenbedingungen in einer Datei (rund 0,5 MB)
`;
	}
	return `# C5 Field Guide (English)

> Unofficial, navigable edition of BSI's C5:2026 Cloud Computing Compliance Criteria Catalogue. The criterion text is BSI's, reproduced unchanged under CC BY-ND 4.0; English edition v${version}.

Deutsche Fassung (primary edition, includes later corrections): [${abs(paths.otherLlms)}](${abs(paths.otherLlms)})

Notes on the catalogue:

- C5:2026 has ${criteria.length} criteria in ${codes.length} domains and ${conditions.length} General Conditions (GC). A criterion such as IAM-06 consists of sub-criteria such as IAM-06.02B. The suffix gives the kind: B = basic criterion, AS = additional criterion that sharpens a basic one, AC = additional criterion that complements.
- Every criterion page is available as Markdown at its address plus \`index.html.md\`, e.g. \`${example}\`. The Markdown also contains BSI's supplementary information, the complementary customer criteria and what changed since C5:2020.
- Many criteria had a different ID in C5:2020 (e.g. IDM-06, now IAM-06). The domain overviews and the changes overview give the former ID.
- This site is not affiliated with BSI. BSI's catalogue is authoritative: ${sourceUrl}

## Domains

${domainList}

## Across all domains

- [Changes since C5:2020](${abs(md(paths.changes))}): status of every criterion (new, changed, unchanged) with its former ID
- [Complementary customer criteria](${abs(md(paths.customers))}): what cloud service customers implement themselves, collected from all criteria

## Optional

- [Complete catalogue](${abs(paths.full)}): all criteria, supplementary information, customer criteria and General Conditions in one file (about 0.5 MB)
`;
}
