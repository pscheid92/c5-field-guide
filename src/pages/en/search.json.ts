// Search index (English), loaded on first use of the search box.
import index from '../../generated/search.en.json';

export const GET = () => new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json' } });
