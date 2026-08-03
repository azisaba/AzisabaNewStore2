import sanitizeHtml from "sanitize-html";

export function sanitizeDescription(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "b",
      "strong",
      "u",
      "em",
      "code",
      "a",
      "span",
    ],
    allowedAttributes: {
      a: ["href"],
      span: ["style"],
    },
    allowedStyles: {
      span: {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i],
      },
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
