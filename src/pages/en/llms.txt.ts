// llms.txt (https://llmstxt.org) for the English catalogue under /en/.
import markdown from '../../generated/markdown.en.json';

export const GET = () => new Response(markdown.llms, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
