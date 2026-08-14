# AGENTS.md

## Project overview

This repository produces a focused catalog of open-source macOS software derived from [`jaywcjlove/awesome-mac`](https://github.com/jaywcjlove/awesome-mac). The upstream repository is the source of truth: read both its main `README.md` application catalog and its `command-line-apps.md` CLI/TUI catalog, then include only entries carrying the upstream `OSS Icon` marker.

Preserve each included entry's upstream category context, order, name, links, and description. Combine both sources into one catalog, placing CLI and TUI entries in a dedicated command-line and terminal category while retaining their upstream subcategories. This is a filtered view of `awesome-mac`, not an independently curated or reclassified application list.

The repository uses Bun 1.3.14 and TypeScript for a small synchronization tool. `src/sync.ts` fetches the upstream application and CLI/TUI catalogs, filters entries by the upstream `OSS Icon` marker, and deterministically generates the root `README.md`. `src/sync.test.ts` covers the synchronization behavior. The generated README is the project artifact; the source documents and synchronization code are its inputs.

## Setup

Bun 1.3.14 is the required runtime and test runner. The synchronization code has no third-party dependencies or generated lockfile.

Run commands from the repository root:

```sh
bun test
bun run sync
bun src/sync.ts
git diff --check
```

`bun test` runs the test suite. `bun run sync` is the normal catalog generation command; `bun src/sync.ts` invokes the same generator directly.

## Development workflow
Source and automation layout:

- `src/sync.ts` — fetches, parses, and generates the filtered catalog.
- `src/sync.test.ts` — synchronization tests run by `bun test`.
- `README.md` — deterministic generated catalog; update it through the sync command.
- `.github/workflows/sync.yml` — scheduled and manually dispatched catalog synchronization.
- `docs/adr/0001-bun-minimal-catalog-sync.md` — rationale for the Bun and generation decisions.

The workflow runs `bun test` before `bun run sync`. It commits and pushes only a changed `README.md`, using the `github-actions[bot]` identity and the exact catalog sync commit message; an unchanged README produces no commit.

- Keep changes focused on the filtered catalog or repository documentation.
- Read both upstream source documents before updating the catalog.
- Include an entry only when upstream marks it with `OSS Icon`; recognize linked and unlinked `Open-Source Software` and `OSS` badge variants.
- Preserve upstream heading context, entry order, indentation, names, links, and descriptions.
- Combine application and CLI/TUI entries into one catalog. Place CLI/TUI entries under a dedicated command-line and terminal category with their upstream subcategories.
- Keep one canonical entry per application. Update an existing entry instead of adding a duplicate.
- Treat the upstream marker as the inclusion rule; do not independently add entries based only on open-source wording, a public repository, or a guessed license.
- Preserve unrelated local and untracked files.

## Testing and validation

Required checks:

1. Run `bun test` for synchronization code or test changes.
2. Run `bun run sync` when parser or generator behavior changes, then review the generated `README.md` diff.
3. Use `bun src/sync.ts` when direct invocation is needed; it must produce the same catalog as `bun run sync`.
4. Run `git diff --check` to catch whitespace errors in tracked changes.
5. Inspect the rendered Markdown structure: headings, lists, tables, and blank lines must remain valid.
6. Confirm every included entry carries a recognized upstream `OSS Icon` marker and preserves the upstream category, order, name, links, and description.

## Code and content style

No repository-specific formatter or style configuration exists yet. Until tracked conventions are established:

- Use standard Markdown and UTF-8 text.
- Use ATX headings (`#`, `##`, and so on) with a blank line around headings and lists.
- Keep one logical item per line so reviews produce focused diffs.
- Preserve existing capitalization for product names and categories.
- Prefer stable HTTPS URLs without tracking parameters.
- Use relative links for files within this repository.
- Do not reflow or reorder unrelated sections while making a targeted change.

If executable code is introduced, keep its formatter, linter, and test configuration with the code. The synchronization tool currently relies on Bun's built-in TypeScript execution and test runner.

## Build and deployment

There is no separate build artifact or deployment process. `README.md` is generated directly from the upstream catalogs. GitHub Actions runs the required tests and synchronization every three days (`0 0 */3 * *`) and supports manual dispatch; with `contents: write` permission, it pushes only changed README output.

## Security and integrity

- Never commit secrets, tokens, private keys, or local environment files.
- Treat external links as untrusted input. Prefer official project and license pages; avoid download mirrors and shortened URLs.
- Do not execute scripts or binaries from applications being evaluated for inclusion.
- Verify license and platform claims from upstream project files or documentation rather than third-party list entries.

## Pull requests

- Keep each change reviewable: one application or one coherent category cleanup per commit when practical.
- Explain the evidence for open-source licensing and macOS support for new entries.
- Summarize changed entries and the validation performed.
- Required checks are `bun test` and, for synchronization changes, `bun run sync` followed by review of the generated README diff. Do not claim checks were run unless they were actually run.

## Maintaining this file

AGENTS.md is living documentation. Update it in the same change that introduces a package manager, source layout, formatter, tests, CI, generated output, deployment process, or nested subproject. A nested `AGENTS.md` should contain only instructions that differ for that subtree; the closest file takes precedence.
