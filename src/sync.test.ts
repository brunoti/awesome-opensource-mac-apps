import { describe, expect, test } from "bun:test";

import {
  canonical_project_url,
  generate_catalog,
  has_oss_marker,
  parse_catalog,
} from "./sync.ts";

const DEFINITIONS = `
[OSS Icon]: https://example.com/oss.svg "Open Source Software"
[Freeware Icon]: https://example.com/free.svg "Freeware"
`;

describe("has_oss_marker", () => {
  test("given linked and unlinked marker variants: should recognize only explicit OSS markers", () => {
    expect(
      has_oss_marker(
        "* [Alpha](https://alpha.test) [![Open-Source Software][OSS Icon]](https://github.com/example/alpha)",
      ),
    ).toBe(true);
    expect(has_oss_marker("* Beta ![OSS][oss icon]")).toBe(true);
    expect(has_oss_marker("* Gamma - Open-source software without the marker")).toBe(false);
  });
});

describe("parse_catalog", () => {
  test("given mixed categories: should preserve marked entries and prune empty branches", () => {
    const source = `
# Preamble

<!--start-->

## Writing

### Empty

* [Closed](https://closed.test) - Closed source.

### Editors

    * [Alpha](https://alpha.test) - Editor. [![Open-Source Software][OSS Icon]](https://github.com/example/alpha) ![Freeware][Freeware Icon]

## Empty Category

* [Also Closed](https://closed.test/two) - Closed source.

<!--end-->
${DEFINITIONS}`;

    expect(parse_catalog(source)).toEqual([
      {
        level: 2,
        title: "Writing",
        entries: [],
        children: [
          {
            level: 3,
            title: "Editors",
            entries: [
              "    * [Alpha](https://alpha.test) - Editor. [![Open-Source Software][OSS Icon]](https://github.com/example/alpha) ![Freeware][Freeware Icon]",
            ],
            children: [],
          },
        ],
      },
    ]);
  });
});

describe("canonical_project_url", () => {
  test("given equivalent repository URLs: should normalize scheme, case, suffix, query, and fragment", () => {
    const first =
      "* [Alpha](https://alpha.test) [![OSS][OSS Icon]](https://GitHub.com/Example/Alpha.git/?source=list#readme)";
    const second =
      "* [Alpha CLI](https://alpha.test/cli) [![Open-Source Software][OSS Icon]](http://github.com/example/alpha)";

    expect(canonical_project_url(first)).toBe("github.com/example/alpha");
    expect(canonical_project_url(second)).toBe("github.com/example/alpha");
  });
});

describe("generate_catalog", () => {
  test("given duplicate app and CLI entries: should keep first repository occurrence", () => {
    const main = `
<!--start-->
## Apps
* [Alpha](https://alpha.test) - Main description. [![Open-Source Software][OSS Icon]](https://github.com/example/alpha)
<!--end-->
${DEFINITIONS}`;
    const cli = `
<!--start-->
## Developer
* [Alpha CLI](https://alpha.test/cli) - CLI description. [![OSS][OSS Icon]](http://github.com/example/alpha/)
<!--end-->
${DEFINITIONS}`;

    const catalog = generate_catalog(main, cli);

    expect(catalog).toContain("Main description.");
    expect(catalog).not.toContain("CLI description.");
  });

  test("given app and CLI categories: should generate two-level TOC, demote CLI headings, and aggregate badge definitions", () => {
    const main = `
<!--start-->
## Writing
### Editors
* [Alpha](https://alpha.test) - Editor. [![Open-Source Software][OSS Icon]](https://github.com/example/alpha) ![Freeware][Freeware Icon]
<!--end-->
${DEFINITIONS}`;
    const cli = `
<!--start-->
## Databases
* [Delta](https://delta.test) - Database client. ![Open-Source Software][OSS Icon]
<!--end-->
${DEFINITIONS}`;

    const catalog = generate_catalog(main, cli);

    expect(catalog).toContain("- [Writing](#writing)");
    expect(catalog).toContain("  - [Editors](#editors)");
    expect(catalog).toContain(
      "- [Command-Line & Terminal Applications](#command-line--terminal-applications)",
    );
    expect(catalog).toContain("  - [Databases](#databases)");
    expect(catalog).toContain("## Command-Line & Terminal Applications");
    expect(catalog).toContain("### Databases");
    expect(catalog).not.toContain("\n## Databases\n");
    expect(catalog).toContain("[OSS Icon]: https://example.com/oss.svg");
    expect(catalog).toContain("[Freeware Icon]: https://example.com/free.svg");
  });
});
