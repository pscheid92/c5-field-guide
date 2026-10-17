// Single-segment routes shared by both languages: /iam/ (domain), /iam-06/
// (criterion), /gc-01/ (general condition). Domain codes and IDs never collide.
import { type Lang, site } from './data';

export type SlugProps =
	| { kind: 'domain'; code: string }
	| { kind: 'criterion'; id: string }
	| { kind: 'condition'; id: string };

export function slugPaths(lang: Lang) {
	const s = site(lang);
	return [
		...s.domains.map((d) => ({ params: { slug: d.code.toLowerCase() }, props: { kind: 'domain', code: d.code } as SlugProps })),
		...s.data.criteria.map((c) => ({ params: { slug: c.id.toLowerCase() }, props: { kind: 'criterion', id: c.id } as SlugProps })),
		...s.data.conditions.items.map((g) => ({
			params: { slug: g.id.toLowerCase() },
			props: { kind: 'condition', id: g.id } as SlugProps,
		})),
	];
}
