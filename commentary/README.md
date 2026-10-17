# Commentary

One Markdown file per criterion and language: `commentary/<lang>/<ID>.md`, for example `commentary/de/IAM-06.md` or `commentary/en/IAM-06.md`. The site loads them as an Astro content collection (`src/content.config.ts`) and shows them on the criterion page below the BSI text, visibly marked as unofficial.

```markdown
---
summary: One or two sentences, shown under the criterion title.
related: [OPS-10, IAM-08]       # listed first under "Related criteria"
status: draft                   # shown next to the commentary label
tags: [logging, mfa]            # stored, not shown yet
---

## What this means in practice
...
```

The body is plain Markdown; use `##` for section headings. Commentary appears only on the page of its own language. The build checks the front matter (for example that `related` contains valid criterion IDs).

Earlier sample drafts are in `drafts/commentary/` (not built).
