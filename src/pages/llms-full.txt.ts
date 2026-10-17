// The whole German catalogue as Markdown, for AI tools (see llms.txt).
import markdown from '../generated/markdown.de.json';

export const GET = () => new Response(markdown.full, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
