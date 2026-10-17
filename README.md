# C5 Field Guide

An unofficial, searchable reference to the BSI C5:2026 cloud criteria catalogue, with a start page (search and all domains), one overview page per domain, and one page per criterion that shows the domain's criteria next to the text. German is the primary language (site root), English lives under `/en/`. Plain [Astro](https://astro.build), static output.

```
npm install
npm run dev      # regenerates the data, then starts http://localhost:4321
npm run build    # static site in dist/
```

## Deploy

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on every push to `main` (or by hand via "Run workflow"). One-time setup in the repository: Settings → Pages → Source: **GitHub Actions**.

On a project site the pages live under `/<repo>/`. The workflow passes that path as `BASE_PATH`; `scripts/lib/base.mjs` hands it to both Astro and the generator, so every internal link carries it. Locally `BASE_PATH` is unset and the site runs at the root. To try the GitHub Pages variant locally:

```
BASE_PATH=/c5catalogue npm run build
BASE_PATH=/c5catalogue npx astro preview   # http://localhost:4321/c5catalogue/
```

## Addresses

| Page | German | English |
|---|---|---|
| Start | `/` | `/en/` |
| Domain | `/iam/` | `/en/iam/` |
| Criterion | `/iam-06/` | `/en/iam-06/` |
| Sub-criterion | `/iam-06/#iam-06-02b` | `/en/iam-06/#iam-06-02b` |
| General condition | `/gc-01/` | `/en/gc-01/` |
| Changes since C5:2020 | `/aenderungen/` | `/en/changes/` |
| About | `/info/` | `/en/info/` |

## How it fits together

| Path | What | Edited by |
|---|---|---|
| `vendor/bsi/` | BSI's machine-readable C5:2026 zips (DE v1.1.0, EN v1.0.1), extracted YAML, PDFs and changelog | never by hand |
| `data/domains.yml` | Domain codes → German and English titles and order (not in BSI's YAML; taken from the PDFs) | us |
| `commentary/<lang>/<ID>.md` | Our commentary per criterion and language (format: `commentary/README.md`) | contributors |
| `paths/` | Task path format, not rendered yet (`paths/README.md`) | contributors |
| `drafts/` | Earlier sample commentary, task path and glossary, not built | — |
| `scripts/generate.mjs` | Turns the BSI YAML into `src/generated/catalog.<lang>.json` and `search.<lang>.json` (git-ignored) | — |
| `src/site/` | Layout, reading panes, search and keyboard handling, styles | — |
| `src/pages/` | Thin page files that wire the views in `src/site/` to the routes above | — |

The generator keeps BSI text verbatim: it only splits paragraphs and numbered lists and links `XX-NN` references. Related criteria come from references in the text (both directions) plus `related:` in commentary. Search runs in the browser on the generated index: IDs first, then titles, then text passages.

While `commentary/` is empty, the build prints one warning that the commentary collection has no files. That is expected.

## Known data quirks

- `AM.yml` (EN) repeats the `information:` key for AM-07. Loaded leniently (last key wins) and asserted.
- The change log (`C5_2026_changelog.xlsx`) is English only so far and, according to BSI, compares C5:2020 with C5:2026 v1.0.0. German pages show its notes in English with a note saying so. The generator reads it with a small built-in xlsx reader (`scripts/lib/xlsx.mjs`) and fails if its IDs stop matching the catalogue. Status comes from BSI's exact wording: no C5:2020 ID → new, "No change." for basic and additional → unchanged, anything else → changed.
- `GC.yml` uses a different schema (`id`/`condition`/`hint`), rendered as "General Conditions".
- DE is v1.1.0 ("Korrekturen und redaktionelle Anpassung") and EN is v1.0.1, so the English text may lag the German corrections. Sub-criterion IDs of AM-01 and AM-02 differ between the two; each language is generated from its own YAML.
