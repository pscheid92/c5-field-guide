// The whole English catalogue as Markdown, for AI tools (see /llms.txt).
import markdown from '../../generated/markdown.en.json';

export const GET = () => new Response(markdown.full, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
