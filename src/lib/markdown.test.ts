import { expect, test, describe } from "bun:test";
import {
  extractWikilinks,
  replaceWikilinks,
  extractHeadings,
  generateSnippet,
  stripMarkdown
} from "./markdown";

describe("markdown utilities", () => {
  describe("extractHeadings", () => {
    test("extracts various levels of headings", () => {
      const content = "# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6";
      const headings = extractHeadings(content);
      expect(headings).toHaveLength(6);
      expect(headings[0]).toEqual({ level: 1, text: "Heading 1", id: "heading-1", line: 1 });
      expect(headings[5]).toEqual({ level: 6, text: "Heading 6", id: "heading-6", line: 6 });
    });

    test("handles leading and trailing whitespace in heading text", () => {
      const content = "#   Spaced Heading   ";
      const headings = extractHeadings(content);
      expect(headings[0].text).toBe("Spaced Heading");
      expect(headings[0].id).toBe("spaced-heading");
    });

    test("generates correct IDs for headings with special characters", () => {
      const content = "# Hello World! (and more) & @#$";
      const headings = extractHeadings(content);
      expect(headings[0].id).toBe("hello-world-and-more-");
    });

    test("ignores lines that are not headings", () => {
      const content = "This is not a heading\n# This is\nNeither is # this";
      const headings = extractHeadings(content);
      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe("This is");
    });

    test("ignores headings without space after hashes", () => {
      const content = "#HeadingWithoutSpace";
      const headings = extractHeadings(content);
      expect(headings).toHaveLength(0);
    });

    test("handles empty content", () => {
      expect(extractHeadings("")).toEqual([]);
    });

    test("handles different line endings", () => {
      const content = "# Line 1\r\n## Line 2\n### Line 3";
      const headings = extractHeadings(content);
      expect(headings).toHaveLength(3);
      expect(headings[1].line).toBe(2);
      expect(headings[2].line).toBe(3);
    });
  });

  describe("extractWikilinks", () => {
    test("extracts simple wikilinks", () => {
      const content = "Check out [[Note 1]] and [[Note 2]]";
      const links = extractWikilinks(content);
      expect(links).toHaveLength(2);
      expect(links[0].target).toBe("Note 1");
      expect(links[1].target).toBe("Note 2");
    });

    test("extracts wikilinks with display text", () => {
      const content = "Read [[Note 1|this note]]";
      const links = extractWikilinks(content);
      expect(links).toHaveLength(1);
      expect(links[0].target).toBe("Note 1");
    });

    test("handles whitespace in wikilinks", () => {
      const content = "[[  Spaced Note  |  display  ]]";
      const links = extractWikilinks(content);
      expect(links[0].target).toBe("Spaced Note");
    });

    test("handles empty content", () => {
      expect(extractWikilinks("")).toEqual([]);
    });

    test("handles multiple wikilinks on the same line", () => {
      const content = "[[Link1]][[Link2]]";
      const links = extractWikilinks(content);
      expect(links).toHaveLength(2);
      expect(links[0].target).toBe("Link1");
      expect(links[1].target).toBe("Link2");
    });
  });

  describe("replaceWikilinks", () => {
    test("replaces simple wikilinks", () => {
      const content = "See [[Note 1]]";
      const result = replaceWikilinks(content, "current");
      expect(result).toBe("See [Note 1](/Note 1.md)");
    });

    test("replaces wikilinks with display text", () => {
      const content = "See [[Note 1|my display]]";
      const result = replaceWikilinks(content, "current");
      expect(result).toBe("See [my display](/Note 1.md)");
    });

    test("handles existing .md extension in target", () => {
      const content = "See [[Note 1.md]]";
      const result = replaceWikilinks(content, "current");
      expect(result).toBe("See [Note 1.md](/Note 1.md)");
    });

    test("trims whitespace from target and display", () => {
      const content = "[[  Note 1  |  Display  ]]";
      const result = replaceWikilinks(content, "current");
      expect(result).toBe("[Display](/Note 1.md)");
    });

    test("handles empty content", () => {
      expect(replaceWikilinks("", "id")).toBe("");
    });
  });

  describe("generateSnippet", () => {
    test("generates snippet around query", () => {
      const content = "This is a long content with a specific keyword in the middle of it.";
      const snippet = generateSnippet(content, "keyword", 30);
      expect(snippet).toContain("keyword");
      expect(snippet.length).toBeLessThanOrEqual(30 + 100 + 6); // roughly
    });

    test("returns start of content if query not found", () => {
      const content = "Hello world. This is some text.";
      const snippet = generateSnippet(content, "missing", 10);
      expect(snippet).toBe("Hello worl...");
    });

    test("handles empty content", () => {
      expect(generateSnippet("", "query")).toBe("");
    });

    test("strips some markdown from snippet", () => {
      const content = "# Heading\nThis is **bold** and [[Link]]";
      const snippet = generateSnippet(content, "bold");
      expect(snippet).not.toContain("#");
      expect(snippet).not.toContain("**");
    });
  });

  describe("stripMarkdown", () => {
    test("strips various markdown elements", () => {
      const content = "# Heading\n**Bold** *Italic* `Code` [Link](url) [[Wiki]]\n- List";
      const stripped = stripMarkdown(content);
      expect(stripped).toBe("Heading Bold Italic Code Link Wiki List");
    });

    test("caps length", () => {
      const content = "This is a very long text that should be capped.";
      const stripped = stripMarkdown(content, 10);
      expect(stripped).toBe("This is a ");
    });

    test("handles empty content", () => {
      expect(stripMarkdown("")).toBe("");
    });

    test("handles wikilinks with display text", () => {
      const content = "[[Link|Display]]";
      const stripped = stripMarkdown(content);
      expect(stripped).toBe("Display");
    });
  });
});
