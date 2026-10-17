// Markdown version of one topic page (llmstxt.org), linked from llms.txt.
import markdown from '../../../generated/markdown.de.json';

const pages: Record<string, string> = markdown.topicPages;

export const getStaticPaths = () => Object.keys(pages).map((topic) => ({ params: { topic } }));

export const GET = ({ params }: { params: { topic: string } }) =>
	new Response(pages[params.topic], { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
