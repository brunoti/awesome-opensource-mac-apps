# Awesome Open Source Mac Apps

A filtered, automated catalog of open-source macOS software derived directly from the upstream `jaywcjlove/awesome-mac` repository.

## Language

**Upstream Source**:
The authoritative remote repository (`jaywcjlove/awesome-mac`), specifically its main catalog (`README.md`) and CLI catalog (`command-line-apps.md`).
_Avoid_: Source repo, parent project, original repo

**Entry**:
A single software listing containing a project title, target website URL, brief description, and metadata badges.
_Avoid_: Item, app item, row, record

**OSS Marker**:
The upstream badge or icon tag (`[OSS Icon]`, `![Open-Source Software][OSS Icon]`, or text variant) designating an entry as open source.
_Avoid_: Open source tag, OSS badge, free marker

**Filtered Catalog**:
The generated markdown catalog (`README.md`) containing exclusively open-source applications organized by category with an auto-generated Table of Contents.
_Avoid_: Output document, list, curated list

**Dedicated CLI Category**:
The top-level category section (`## Command-Line & Terminal Applications`) hosting all entries from `command-line-apps.md` while preserving their upstream subcategories.
_Avoid_: Terminal tools, CLI section, command line category

**Sync Workflow**:
The automated GitHub Actions workflow scheduled every 3 days and triggered on manual dispatch to fetch upstream sources, parse OSS entries, and commit updates.
_Avoid_: Cron job, CI script, updater
