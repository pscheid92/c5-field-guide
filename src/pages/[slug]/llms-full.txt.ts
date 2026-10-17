// /iam/llms-full.txt, /gc/llms-full.txt: one area's full text as Markdown, for
// contexts too small for /llms-full.txt (listed in llms.txt under Optional).
import markdown from '../../generated/markdown.de.json';

const areas: Record<string, string> = markdown.areas;

export const getStaticPaths = () => Object.keys(areas).map((code) => ({ params: { slug: code.toLowerCase() }, props: { code } }));

export const GET = ({ props }: { props: { code: string } }) =>
	new Response(areas[props.code], { headers: { 'content-type': 'text/plain; charset=utf-8' } });
