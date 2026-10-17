// Client behaviour for the catalogue browser: instant search, keyboard
// navigation, copy links and stable scroll positions in the side panes. Language-specific URLs and labels come from
// data attributes on the search input (see Layout.astro).
import { navigate } from 'astro:transitions/client';

type Entry = {
	id: string;
	name: string;
	domain: string;
	url: string;
	subs: { id: string; kind: string; anchor: string; text: string }[];
	customer: string;
};
type Hit = { href: string; id: string; name: string; snippet?: string };

const MAX_TITLE_HITS = 12;
const MAX_TEXT_HITS = 30;

/* ------------------------------------------------------------ search */

// One index per language, keyed by its URL (/search.json, /en/search.json).
const indexes = new Map<string, Promise<Entry[]>>();
const load = (url: string) => {
	if (!indexes.has(url)) indexes.set(url, fetch(url).then((r) => r.json()));
	return indexes.get(url)!;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "iam6", "IAM-06", "iam-06.02b", "IAM 06 2B", "gc1" → criterion and optional sub-criterion. */
function parseId(query: string) {
	const m = query
		.toLowerCase()
		.replace(/\s+/g, '')
		.match(/^([a-z]{2,4})-?(\d{1,2})(?:[.-]?(\d{1,2})(b|as|ac))?$/);
	if (!m) return null;
	return {
		criterion: `${m[1].toUpperCase()}-${m[2].padStart(2, '0')}`,
		sub: m[3] ? `${m[3].padStart(2, '0')}${m[4].toUpperCase()}` : null,
	};
}

// Short terms (abbreviations like MFA, TLS, SOC) only match at the start of
// a word, so "mfa" does not find "Umfang". Longer terms also match inside
// words, which German compounds need ("schlüssel" in "Kryptoschlüssel").
const pattern = (term: string) =>
	new RegExp(term.length <= 3 ? `(?<![\\p{L}\\p{N}])${reEsc(term)}` : reEsc(term), 'giu');
const count = (text: string, term: string) => text.match(pattern(term))?.length ?? 0;

function highlight(text: string, terms: string[]) {
	let html = esc(text);
	for (const term of terms) html = html.replace(pattern(esc(term)), '<mark>$&</mark>');
	return html;
}

function snippet(text: string, terms: string[]) {
	const hits = terms.map((t) => text.search(pattern(t))).filter((i) => i >= 0);
	const at = hits.length ? Math.min(...hits) : 0;
	let start = Math.max(0, at - 60);
	if (start > 0) start = text.indexOf(' ', start) + 1 || start;
	const end = Math.min(text.length, at + 170);
	return (start > 0 ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
}

type Labels = { customer: string; customerAnchor: string };

function search(query: string, entries: Entry[], labels: Labels): { ids: Hit[]; text: Hit[]; terms: string[] } {
	const q = query.trim();
	const terms = q
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length >= 2);
	const ids: Hit[] = [];
	const text: (Hit & { score: number })[] = [];
	if (!q) return { ids, text, terms };

	// 1. An ID ("iam-06", "iam6.2b") or a bare domain code ("cry").
	const parsed = parseId(q);
	if (parsed) {
		const c = entries.find((e) => e.id === parsed.criterion);
		if (c) {
			const sub = parsed.sub && c.subs.find((s) => s.id === parsed.sub);
			ids.push(
				sub
					? { href: `${c.url}#${sub.anchor}`, id: `${c.id}.${sub.id}`, name: esc(c.name), snippet: esc(snippet(sub.text, [])) }
					: { href: c.url, id: c.id, name: esc(c.name) },
			);
		}
	} else if (/^[a-z]{2,4}$/i.test(q)) {
		for (const c of entries.filter((e) => e.domain === q.toUpperCase())) ids.push({ href: c.url, id: c.id, name: esc(c.name) });
	}

	if (!terms.length) return { ids, text, terms };

	// 2. Titles containing every term.
	for (const c of entries) {
		if (ids.length >= MAX_TITLE_HITS) break;
		const hay = `${c.id} ${c.name}`.toLowerCase();
		if (terms.every((t) => count(hay, t) > 0) && !ids.some((h) => h.id === c.id)) {
			ids.push({ href: c.url, id: c.id, name: highlight(c.name, terms) });
		}
	}

	// 3. Sub-criteria (and customer criteria) whose text contains every term,
	//    ranked by how often the terms occur.
	for (const c of entries) {
		const blocks = [
			...c.subs.map((s) =>
				s.id
					? { href: `${c.url}#${s.anchor}`, id: `${c.id}.${s.id}`, text: s.text }
					: { href: c.url, id: c.id, text: s.text },
			),
			...(c.customer
				? [{ href: `${c.url}#${labels.customerAnchor}`, id: `${c.id} · ${labels.customer}`, text: c.customer }]
				: []),
		];
		for (const b of blocks) {
			const lower = b.text.toLowerCase();
			const counts = terms.map((t) => count(lower, t));
			if (counts.some((n) => n === 0)) continue;
			const score = counts.reduce((a, b) => a + b, 0);
			text.push({ href: b.href, id: b.id, name: esc(c.name), snippet: highlight(snippet(b.text, terms), terms), score });
		}
	}
	text.sort((a, b) => b.score - a.score);
	return { ids, text: text.slice(0, MAX_TEXT_HITS), terms };
}

function initSearch() {
	const input = document.getElementById('c5-search') as HTMLInputElement | null;
	const box = document.getElementById('c5-results');
	if (!input || !box || input.dataset.ready) return;
	input.dataset.ready = '1';
	const d = input.dataset;
	const indexUrl = d.index!;
	const labels: Labels = { customer: d.labelCustomer!, customerAnchor: d.customerAnchor! };

	let active = -1;
	const options = () => [...box.querySelectorAll<HTMLAnchorElement>('.result')];

	const close = () => {
		box.hidden = true;
		input.setAttribute('aria-expanded', 'false');
		input.removeAttribute('aria-activedescendant');
		active = -1;
	};
	const select = (i: number) => {
		const all = options();
		if (!all.length) return;
		active = (i + all.length) % all.length;
		all.forEach((o, n) => o.setAttribute('aria-selected', String(n === active)));
		input.setAttribute('aria-activedescendant', all[active].id);
		all[active].scrollIntoView({ block: 'nearest' });
	};

	const render = async () => {
		const q = input.value.trim();
		if (!q) return close();
		const entries = await load(indexUrl);
		if (input.value.trim() !== q) return; // a newer keystroke is on its way
		const { ids, text } = search(q, entries, labels);
		let n = 0;
		const item = (h: Hit) =>
			`<a class="result" role="option" id="c5-r${n++}" aria-selected="false" href="${h.href}">` +
			`<div class="result-head"><span class="result-id">${esc(h.id)}</span><span class="result-name">${h.name}</span></div>` +
			(h.snippet ? `<div class="result-snippet">${h.snippet}</div>` : '') +
			`</a>`;
		let html = '';
		if (ids.length) html += `<div class="results-group">${esc(d.labelCriteria!)}</div>${ids.map(item).join('')}`;
		if (text.length) html += `<div class="results-group">${esc(d.labelPassages!)}</div>${text.map(item).join('')}`;
		box.innerHTML = html || `<div class="results-empty">${esc(d.labelEmpty!)} „${esc(q)}“.</div>`;
		box.hidden = false;
		input.setAttribute('aria-expanded', 'true');
		active = -1;
		if (ids.length || text.length) select(0);
	};

	let timer: number | undefined;
	input.addEventListener('input', () => {
		clearTimeout(timer);
		timer = window.setTimeout(render, 60);
	});
	input.addEventListener('focus', () => {
		load(indexUrl);
		if (input.value.trim()) render();
	});
	input.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			select(active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			select(active - 1);
		} else if (e.key === 'Enter') {
			const target = options()[active];
			if (target) {
				e.preventDefault();
				close();
				input.blur();
				navigate(target.href);
			}
		} else if (e.key === 'Escape') {
			if (box.hidden) input.blur();
			close();
		}
	});
	box.addEventListener('click', (e) => {
		if ((e.target as Element).closest('.result')) {
			close();
			input.blur();
		}
	});
	closeResults = close;
}

// Clicking anywhere outside the search box closes its results. One listener for
// the whole session; it always talks to the search box of the current page.
let closeResults: (() => void) | null = null;
document.addEventListener('click', (e) => {
	if (!(e.target as Element).closest('.search')) closeResults?.();
});

/* ------------------------------------------------------------ keyboard */

document.addEventListener('keydown', (e) => {
	const target = e.target as HTMLElement;
	const typing = target.matches('input, textarea, select, [contenteditable]');

	// "/" or Cmd/Ctrl+K: jump into the search box from anywhere.
	if ((!typing && e.key === '/') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
		e.preventDefault();
		const input = document.getElementById('c5-search') as HTMLInputElement | null;
		input?.focus();
		input?.select();
		return;
	}

	// Arrow keys move between rows of the domain and criteria lists.
	if (!typing && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && target.matches('.row')) {
		const rows = [...(target.closest('.rows')?.querySelectorAll<HTMLElement>('.row') ?? [])];
		const next = rows[rows.indexOf(target) + (e.key === 'ArrowDown' ? 1 : -1)];
		if (next) {
			e.preventDefault();
			next.focus();
		}
	}
});

/* ------------------------------------------------------------ example queries on the start page */

document.addEventListener('click', (e) => {
	const example = (e.target as Element).closest<HTMLButtonElement>('.example');
	if (!example) return;
	e.stopPropagation();
	const input = document.getElementById('c5-search') as HTMLInputElement | null;
	if (!input) return;
	input.value = example.dataset.query ?? '';
	input.focus();
	input.dispatchEvent(new Event('input'));
});

/* ------------------------------------------------------------ copy link */

document.addEventListener('click', async (e) => {
	const button = (e.target as Element).closest<HTMLButtonElement>('.copy');
	if (!button) return;
	const url = `${location.origin}${location.pathname}#${button.dataset.anchor}`;
	try {
		await navigator.clipboard.writeText(url);
	} catch {
		location.hash = button.dataset.anchor ?? '';
		return;
	}
	const label = button.textContent;
	button.textContent = button.dataset.copied ?? label;
	button.classList.add('copied');
	setTimeout(() => {
		button.textContent = label;
		button.classList.remove('copied');
	}, 1600);
});

/* ------------------------------------------------------------ outline: mark the sub-criterion being read */

function updateOutline() {
	const links = [...document.querySelectorAll<HTMLAnchorElement>('.outline a[href^="#"]')];
	if (!links.length || getComputedStyle(links[0].closest('.outline')!).display === 'none') return;
	const line = (document.querySelector('.bar')?.getBoundingClientRect().height ?? 56) + 120;
	let current = links[0];
	for (const link of links) {
		const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
		if (target && target.getBoundingClientRect().top <= line) current = link;
	}
	if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = links[links.length - 1];
	for (const link of links) {
		if (link === current) link.setAttribute('aria-current', 'true');
		else link.removeAttribute('aria-current');
	}
}

let outlineQueued = false;
window.addEventListener(
	'scroll',
	() => {
		if (outlineQueued) return;
		outlineQueued = true;
		requestAnimationFrame(() => {
			outlineQueued = false;
			updateOutline();
		});
	},
	{ passive: true },
);
window.addEventListener('resize', updateOutline);

/* ------------------------------------------------------------ side panes keep their scroll position */

const saved = { domains: 0, list: 0, listDomain: '' };
document.addEventListener('astro:before-swap', () => {
	const domains = document.querySelector<HTMLElement>('[data-pane="domains"]');
	const list = document.querySelector<HTMLElement>('[data-pane="list"]');
	saved.domains = domains?.scrollTop ?? 0;
	saved.list = list?.scrollTop ?? 0;
	saved.listDomain = list?.dataset.domain ?? '';
});

// Bring the selected domain/criterion into view inside its pane. Scrolls only
// the pane itself: scrollIntoView would also scroll the page and hide the
// start of the text in the reader.
function revealCurrent() {
	for (const pane of document.querySelectorAll<HTMLElement>('[data-pane]')) {
		const current = pane.querySelector<HTMLElement>('[aria-current]');
		if (!current) continue;
		const p = pane.getBoundingClientRect();
		const r = current.getBoundingClientRect();
		if (r.top < p.top || r.bottom > p.bottom) {
			pane.scrollTop += r.top - p.top - (pane.clientHeight - r.height) / 2;
		}
	}
}

document.addEventListener('astro:after-swap', () => {
	const domains = document.querySelector<HTMLElement>('[data-pane="domains"]');
	const list = document.querySelector<HTMLElement>('[data-pane="list"]');
	if (domains) domains.scrollTop = saved.domains;
	if (list && list.dataset.domain === saved.listDomain) list.scrollTop = saved.list;
});

document.addEventListener('astro:page-load', () => {
	initSearch();
	revealCurrent();
	updateOutline();
});
