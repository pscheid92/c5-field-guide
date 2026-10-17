// Markdown version of the values page (llmstxt.org), linked from llms.txt.
import markdown from '../../generated/markdown.de.json';

export const GET = () => new Response(markdown.values, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
