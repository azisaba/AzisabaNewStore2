import { describe, expect, it } from "vitest";
import { sanitizeDescription } from "./sanitize-description";

describe("sanitizeDescription", () => {
  it("商品説明の許可された装飾だけを残す", () => {
    const result = sanitizeDescription(
      '<p onclick="bad()">説明 <span style="color: #ff55ff; position: fixed">色</span></p>',
    );
    expect(result).toContain("<p>説明");
    expect(result).toContain("color:#ff55ff");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("position");
  });

  it("危険なリンクとscriptを除去する", () => {
    const result = sanitizeDescription(
      '<script>alert(1)</script><a href="javascript:alert(1)">link</a>',
    );
    expect(result).not.toContain("script");
    expect(result).not.toContain("javascript:");
  });
});
