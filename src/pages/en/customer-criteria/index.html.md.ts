// Markdown version of the customer criteria page (llmstxt.org), linked from llms.txt.
import markdown from '../../../generated/markdown.en.json';

export const GET = () => new Response(markdown.customers, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
