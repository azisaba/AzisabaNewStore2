import { describe, expect, it } from "vitest";

import {
  buildStoreModal,
  parseAllowedUserIds,
  parseStoreCommand,
} from "./command-handler";
import type { Interaction } from "./types";

describe("parseAllowedUserIds", () => {
  it("accepts exact Discord user ids", () => {
    expect([
      ...parseAllowedUserIds('["123456789012345678","987654321098765432"]'),
    ]).toEqual(["123456789012345678", "987654321098765432"]);
  });

  it("rejects non-array and non-numeric values", () => {
    expect(() => parseAllowedUserIds('"123"')).toThrow();
    expect(() => parseAllowedUserIds('["admin"]')).toThrow();
  });
});

describe("parseStoreCommand", () => {
  it("maps a product update command to an API payload", () => {
    const interaction = {
      data: {
        name: "store",
        options: [
          {
            name: "product",
            type: 2,
            options: [
              {
                name: "update",
                type: 1,
                options: [
                  { name: "id", type: 4, value: 5 },
                  { name: "hidden", type: 5, value: true },
                ],
              },
            ],
          },
        ],
      },
    } as Interaction;
    expect(parseStoreCommand(interaction)).toEqual({
      action: "update",
      payload: { kind: "product", id: 5, hidden: true },
    });
  });

  it("opens create in a modal with a multiline description", () => {
    const interaction = {
      data: {
        name: "store",
        options: [
          {
            name: "product",
            type: 2,
            options: [
              {
                name: "create",
                type: 1,
                options: [
                  { name: "price", type: 4, value: 500 },
                  { name: "hidden", type: 5, value: true },
                ],
              },
            ],
          },
        ],
      },
    } as Interaction;
    const modal = buildStoreModal(interaction) as {
      type: number;
      data: {
        custom_id: string;
        components: Array<{
          components: Array<{ custom_id: string; style: number }>;
        }>;
      };
    };
    expect(modal.type).toBe(9);
    expect(modal.data.custom_id).toBe("store|product|create|0|500|1");
    expect(
      modal.data.components
        .flatMap((row) => row.components)
        .find((component) => component.custom_id === "description")?.style,
    ).toBe(2);
  });
});
