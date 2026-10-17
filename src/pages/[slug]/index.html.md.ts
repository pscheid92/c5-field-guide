// /iam-06/index.html.md, /iam/index.html.md: a criterion, General Condition or
// domain overview as Markdown, at the address llmstxt.org gives pages whose
// URL ends in "/".
import markdown from '../../generated/markdown.de.json';

const items: Record<string, string> = markdown.items;

export const getStaticPaths = () => Object.keys(items).map((id) => ({ params: { slug: id.toLowerCase() }, props: { id } }));

export const GET = ({ props }: { props: { id: string } }) =>
	new Response(items[props.id], { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
