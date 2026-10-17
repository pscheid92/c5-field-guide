// /en/iam-06/index.html.md, /en/iam/index.html.md: criterion, General Condition
// or domain overview as Markdown.
import markdown from '../../../generated/markdown.en.json';

const items: Record<string, string> = markdown.items;

export const getStaticPaths = () => Object.keys(items).map((id) => ({ params: { slug: id.toLowerCase() }, props: { id } }));

export const GET = ({ props }: { props: { id: string } }) =>
	new Response(items[props.id], { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
