# ADR 0001: Bun Minimal Catalog Synchronization

- **Status:** Accepted

## Context

The catalog is a filtered, generated view of two Markdown documents in
`jaywcjlove/awesome-mac`: the main application catalog and the
command-line-apps catalog. Entries are included when the upstream document
marks them with the OSS Icon, and the generated `README.md` must retain the
upstream category context and order.

The synchronization code needs to run locally and in GitHub Actions with a
small, reproducible setup. Generated output should change only when the
upstream catalog data or the generation rules change; otherwise scheduled runs
should be no-ops.

## Decision

Use Bun 1.3.14 and TypeScript for the synchronization implementation. Keep the
implementation dependency-free: `src/sync.ts` uses Bun and the standard
runtime APIs to fetch and parse the two upstream Markdown sources and to
produce the catalog. The repository's commands are `bun test`, `bun run sync`,
and the direct equivalent `bun src/sync.ts`.

Generate `README.md` deterministically. The parser preserves the required
upstream category context, entry order, names, links, and descriptions, while
the generator emits the same content and structure for the same upstream
inputs. The GitHub Actions workflow runs tests before synchronization and
commits only a changed `README.md`, using the catalog-sync bot identity and
commit message defined by the workflow contract.

## Consequences

- A fresh checkout needs Bun, but no third-party package installation or lockfile.
- Deterministic generation keeps reviews focused on actual upstream catalog
  changes and makes scheduled no-change runs cheap and safe.
- The parser intentionally depends on the Markdown structure and OSS marker
  conventions used by the upstream documents; upstream format changes may
  require updates to the synchronization code and its tests.
- GitHub Actions validates the generator before running it and leaves the
  repository untouched when the generated README is unchanged.
