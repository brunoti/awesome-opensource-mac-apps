const MAIN_CATALOG_URL =
  "https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/README.md";
const CLI_CATALOG_URL =
  "https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/command-line-apps.md";
const CATALOG_TITLE = "Awesome Open-Source macOS Apps";
const CLI_CATEGORY_TITLE = "Command-Line & Terminal Applications";

export interface CatalogSection {
  readonly level: number;
  readonly title: string;
  readonly entries: readonly string[];
  readonly children: readonly CatalogSection[];
}

interface MutableSection {
  level: number;
  title: string;
  entries: string[];
  children: MutableSection[];
}

interface Heading {
  readonly level: number;
  readonly title: string;
}

interface ReferenceDefinition {
  readonly key: string;
  readonly line: string;
}

export function has_oss_marker(text: string): boolean {
  return /\[\s*oss icon\s*\]/i.test(text);
}

function clean_heading_title(raw_title: string): string {
  const without_badge = raw_title.split(/\s+\[!\[/, 1)[0] ?? raw_title;

  return without_badge
    .replace(/\s+#+\s*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

function catalog_region(markdown: string): string {
  const start_marker = "<!--start-->";
  const end_marker = "<!--end-->";
  const start = markdown.indexOf(start_marker);
  const end = markdown.indexOf(end_marker, start + start_marker.length);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Upstream catalog is missing its <!--start-->/<!--end--> boundaries");
  }

  return markdown.slice(start + start_marker.length, end);
}

function prune_sections(sections: readonly MutableSection[]): CatalogSection[] {
  const result: CatalogSection[] = [];

  for (const section of sections) {
    const children = prune_sections(section.children);
    if (section.entries.length === 0 && children.length === 0) {
      continue;
    }

    result.push({
      level: section.level,
      title: section.title,
      entries: [...section.entries],
      children,
    });
  }

  return result;
}

export function parse_catalog(markdown: string): readonly CatalogSection[] {
  const roots: MutableSection[] = [];
  const stack: MutableSection[] = [];

  for (const line of catalog_region(markdown).replace(/\r\n?/g, "\n").split("\n")) {
    const heading_match = /^(#{2,6})\s+(.+?)\s*$/.exec(line);
    if (heading_match) {
      const level = heading_match[1]?.length ?? 0;
      const title = clean_heading_title(heading_match[2] ?? "");
      if (!title) {
        continue;
      }

      const section: MutableSection = {
        level,
        title,
        entries: [],
        children: [],
      };

      while ((stack.at(-1)?.level ?? 0) >= level) {
        stack.pop();
      }

      const parent = stack.at(-1);
      if (parent) {
        parent.children.push(section);
      } else {
        roots.push(section);
      }
      stack.push(section);
      continue;
    }

    if (/^\s*[*+-]\s+/.test(line) && has_oss_marker(line)) {
      stack.at(-1)?.entries.push(line);
    }
  }

  return prune_sections(roots);
}

function linked_marker_url(entry: string): string | null {
  const markdown_link =
    /\[((?:[^\[\]]|\[[^\]]*\])*)\]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/gi;

  for (const match of entry.matchAll(markdown_link)) {
    if (has_oss_marker(match[0])) {
      return match[2] ?? null;
    }
  }

  return null;
}

function first_entry_url(entry: string): string | null {
  return /\]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/i.exec(entry)?.[1] ?? null;
}

function normalize_url(raw_url: string): string {
  const url = new URL(raw_url);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let pathname = url.pathname.replace(/\/+$/, "").replace(/\.git$/i, "");

  if (
    host === "github.com" ||
    host === "gitlab.com" ||
    host === "bitbucket.org" ||
    host === "codeberg.org"
  ) {
    pathname = pathname.toLowerCase();
  }

  return `${host}${pathname}`;
}

export function canonical_project_url(entry: string): string | null {
  const project_url = linked_marker_url(entry) ?? first_entry_url(entry);
  return project_url ? normalize_url(project_url) : null;
}

function deduplicate_sections(
  sections: readonly CatalogSection[],
  seen_projects: Set<string>,
): CatalogSection[] {
  const result: CatalogSection[] = [];

  for (const section of sections) {
    const entries = section.entries.filter((entry) => {
      const project_url = canonical_project_url(entry);
      if (!project_url) {
        return true;
      }
      if (seen_projects.has(project_url)) {
        return false;
      }

      seen_projects.add(project_url);
      return true;
    });
    const children = deduplicate_sections(section.children, seen_projects);

    if (entries.length > 0 || children.length > 0) {
      result.push({
        level: section.level,
        title: section.title,
        entries,
        children,
      });
    }
  }

  return result;
}

function collect_headings(
  sections: readonly CatalogSection[],
  level_offset: number,
  headings: Heading[],
): void {
  for (const section of sections) {
    const level = section.level + level_offset;
    if (level <= 3) {
      headings.push({ level, title: section.title });
    }
    collect_headings(section.children, level_offset, headings);
  }
}

function github_slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

function unique_slug(title: string, slug_counts: Map<string, number>): string {
  const base = github_slug(title);
  const count = slug_counts.get(base) ?? 0;
  slug_counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function render_toc(headings: readonly Heading[]): string[] {
  const slug_counts = new Map<string, number>();
  unique_slug(CATALOG_TITLE, slug_counts);
  unique_slug("Contents", slug_counts);

  return headings.map((heading) => {
    const indent = heading.level === 3 ? "  " : "";
    return `${indent}- [${heading.title}](#${unique_slug(heading.title, slug_counts)})`;
  });
}

function render_sections(
  sections: readonly CatalogSection[],
  level_offset: number,
  output: string[],
): void {
  for (const section of sections) {
    output.push(`${"#".repeat(section.level + level_offset)} ${section.title}`, "");

    if (section.entries.length > 0) {
      output.push(...section.entries, "");
    }

    render_sections(section.children, level_offset, output);
  }
}

function parse_reference_definitions(markdown: string): ReferenceDefinition[] {
  const definitions: ReferenceDefinition[] = [];

  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const match = /^\[([^\]]+)\]:\s+\S.*$/.exec(line);
    if (match) {
      definitions.push({ key: (match[1] ?? "").toLowerCase(), line });
    }
  }

  return definitions;
}

function used_reference_keys(markdown: string): readonly string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const match of markdown.matchAll(/\]\[([^\]]+)\]/g)) {
    const key = (match[1] ?? "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }

  return keys;
}

function collect_used_definitions(
  body: string,
  main_markdown: string,
  cli_markdown: string,
): string[] {
  const available = new Map<string, string>();
  for (const definition of [
    ...parse_reference_definitions(main_markdown),
    ...parse_reference_definitions(cli_markdown),
  ]) {
    if (!available.has(definition.key)) {
      available.set(definition.key, definition.line);
    }
  }

  return used_reference_keys(body).map((key) => {
    const definition = available.get(key);
    if (!definition) {
      throw new Error(`Missing upstream reference definition for [${key}]`);
    }
    return definition;
  });
}

export function generate_catalog(main_markdown: string, cli_markdown: string): string {
  const seen_projects = new Set<string>();
  const main_sections = deduplicate_sections(parse_catalog(main_markdown), seen_projects);
  const cli_sections = deduplicate_sections(parse_catalog(cli_markdown), seen_projects);
  const headings: Heading[] = [];

  collect_headings(main_sections, 0, headings);
  if (cli_sections.length > 0) {
    headings.push({ level: 2, title: CLI_CATEGORY_TITLE });
    collect_headings(cli_sections, 1, headings);
  }

  const output = [
    `# ${CATALOG_TITLE}`,
    "",
    "This catalog is generated from the [jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) application and command-line catalogs. It includes only entries carrying the upstream `OSS Icon` marker.",
    "",
    "Run `bun run sync` to refresh it. Do not edit generated entries manually.",
    "",
    "## Contents",
    "",
    ...render_toc(headings),
    "",
  ];

  render_sections(main_sections, 0, output);
  if (cli_sections.length > 0) {
    output.push(`## ${CLI_CATEGORY_TITLE}`, "");
    render_sections(cli_sections, 1, output);
  }

  while (output.at(-1) === "") {
    output.pop();
  }

  const body = `${output.join("\n")}\n`;
  const definitions = collect_used_definitions(body, main_markdown, cli_markdown);
  return definitions.length > 0 ? `${body}\n${definitions.join("\n")}\n` : body;
}

async function fetch_markdown(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function sync_catalog(): Promise<void> {
  const [main_markdown, cli_markdown] = await Promise.all([
    fetch_markdown(MAIN_CATALOG_URL),
    fetch_markdown(CLI_CATALOG_URL),
  ]);
  const catalog = generate_catalog(main_markdown, cli_markdown);
  const readme_path = new URL("../README.md", import.meta.url);
  await Bun.write(readme_path, catalog);
  console.log(`Updated README.md with ${catalog.split("\n").length - 1} lines.`);
}

if (import.meta.main) {
  await sync_catalog();
}
