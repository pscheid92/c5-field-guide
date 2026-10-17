// llms.txt (https://llmstxt.org) for the German catalogue at the site root.
// English: /en/llms.txt. Written by scripts/generate.mjs.
import markdown from '../generated/markdown.de.json';

export const GET = () => new Response(markdown.llms, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
