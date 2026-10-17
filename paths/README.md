# Task paths

One YAML file per path and language: `paths/<lang>/<slug>.yml`. Use the same file name in both languages.

```yaml
title: "Page title"
label: Short sidebar label
order: 1
description: One sentence for search and link previews.
intro: |
  Markdown shown above the steps.
sections:
  - title: Section heading
    intro: Optional Markdown.
    steps:
      - id: IAM-06                  # criterion ID, checked against the catalogue
        why: Why this criterion matters for the task.
        focus: [02B, 09B]           # sub-criteria to link to, checked as well
outro: |
  Optional Markdown shown below the steps.
```

Task paths are not rendered by the site yet: the format above is kept for when we add them. Earlier sample drafts are in `drafts/paths/` (not built).
