// Search index (German), loaded on first use of the search box.
import index from '../generated/search.de.json';

export const GET = () => new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json' } });
