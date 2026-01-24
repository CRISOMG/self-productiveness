import { describe, it, expect } from "bun:test";
import { parseMessageComponents } from "../shared/utils/messageParser";
import { test_real_examples } from "./UMessage.example.js";
import { extractContent } from "./extractContent";

// testsprite "Hey, help me to test this project with TestSprite."

describe("Parser Comparison", () => {
  describe("parseMessageComponents (Existing Logic)", () => {
    it("case_1: should handle raw text content with nested brackets", async () => {
      const module = await test_real_examples.case_1;
      const data = module.default || module;
      const textContent = data.content; // Use the actual content string

      const components = parseMessageComponents(textContent);

      const logs = components.filter((c) => c.type === "log");
      expect(logs.length).toBeGreaterThan(0);
    });

    it("case_2: should handle raw text content with multiple tools", async () => {
      const module = await test_real_examples.case_2;
      const data = module.default || module;
      const textContent = data.content;

      const components = parseMessageComponents(textContent);

      const logs = components.filter((c) => c.type === "log");

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("extractContent (New Logic)", () => {
    it("case_1: should separate technical part from message", async () => {
      const module = await test_real_examples.case_1;
      const data = module.default || module;
      const textContent = data.content;

      const result = extractContent(textContent);

      // Verify technical part captures the tools
      expect(result.technical).toContain("Used tools");

      // Verify message part captures the rest
      expect(result.message).toContain("Estado Actual del Proyecto YourFocus");
    });

    it("case_2: should separate technical part from message with multiple tools", async () => {
      const module = await test_real_examples.case_2;
      const data = module.default || module;
      const textContent = data.content;

      const result = extractContent(textContent);

      expect(result.technical).toContain("Used tools");
      expect(result.technical).toContain(
        "tool_download_and_transcribe_from_google_drive_by_id",
      );

      expect(result.message).toContain("Análisis de Bitácora");
    });
  });
});
