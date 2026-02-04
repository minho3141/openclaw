import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readPrefillContent, stripPrefillFromResponse } from "./prefill.js";

describe("prefill", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prefill-test-"));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("readPrefillContent", () => {
    it("should return undefined if PREFILL.md doesn't exist", async () => {
      const result = await readPrefillContent(tmpDir);
      expect(result).toBeUndefined();
    });

    it("should return content if PREFILL.md exists", async () => {
      const prefillPath = path.join(tmpDir, "PREFILL.md");
      await fs.writeFile(prefillPath, "Test prefill content");
      const result = await readPrefillContent(tmpDir);
      expect(result).toBe("Test prefill content");
    });

    it("should return undefined if PREFILL.md is empty", async () => {
      const prefillPath = path.join(tmpDir, "PREFILL.md");
      await fs.writeFile(prefillPath, "   \n\n  ");
      const result = await readPrefillContent(tmpDir);
      expect(result).toBeUndefined();
    });

    it("should trim whitespace", async () => {
      const prefillPath = path.join(tmpDir, "PREFILL.md");
      await fs.writeFile(prefillPath, "\n\n  Test content  \n\n");
      const result = await readPrefillContent(tmpDir);
      expect(result).toBe("Test content");
    });
  });

  describe("stripPrefillFromResponse", () => {
    it("should return original response if prefill is undefined", () => {
      const response = "Full response text";
      const result = stripPrefillFromResponse(response, undefined);
      expect(result).toBe(response);
    });

    it("should strip exact prefix match", () => {
      const prefill = "I'll help you with that.";
      const response = "I'll help you with that. Here's the solution: ...";
      const result = stripPrefillFromResponse(response, prefill);
      expect(result).toBe("Here's the solution: ...");
    });

    it("should return original if prefill not found", () => {
      const prefill = "Different text";
      const response = "Original response";
      const result = stripPrefillFromResponse(response, prefill);
      expect(result).toBe(response);
    });

    it("should handle empty response", () => {
      const prefill = "Prefill text";
      const response = "";
      const result = stripPrefillFromResponse(response, prefill);
      expect(result).toBe("");
    });

    it("should strip with whitespace normalization", () => {
      const prefill = "I'll help you.";
      const response = "I'll  help  you. Here's the answer.";
      const result = stripPrefillFromResponse(response, prefill);
      // Should strip based on word count
      expect(result).toContain("answer");
    });
  });
});
