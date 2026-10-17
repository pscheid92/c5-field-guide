// Our own commentary per criterion and language: commentary/<lang>/<ID>.md,
// for example commentary/de/IAM-06.md (format: commentary/README.md). Rendered
// below the BSI text on the criterion page, visibly marked as unofficial.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const commentary = defineCollection({
	loader: glob({ pattern: '{de,en}/*.md', base: './commentary' }),
	schema: z.object({
		summary: z.string().optional(),
		tags: z.array(z.string()).optional(),
		related: z.array(z.string().regex(/^[A-Z]{2,4}-\d{2}$/)).optional(),
		status: z.string().optional(),
	}),
});

export const collections = { commentary };
