// Markdown version of the topic overview (llmstxt.org), linked from llms.txt.
import markdown from '../../generated/markdown.de.json';

export const GET = () => new Response(markdown.topicsIndex, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
