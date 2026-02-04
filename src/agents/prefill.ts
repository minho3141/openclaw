/**
 * Prefill feature: Read PREFILL.md from agent workspace and inject as assistant message.
 * Ephemeral — stripped after response.
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Read PREFILL.md from workspace if it exists.
 * Returns trimmed content, or undefined if file doesn't exist or is empty.
 */
export async function readPrefillContent(workspacePath: string): Promise<string | undefined> {
  try {
    const prefillPath = path.join(workspacePath, "PREFILL.md");
    const content = await fs.readFile(prefillPath, "utf-8");
    const trimmed = content.trim();
    return trimmed || undefined;
  } catch (error) {
    // File doesn't exist or can't be read
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    // Log other errors but don't fail
    console.warn("[prefill] Error reading PREFILL.md:", error);
    return undefined;
  }
}

/**
 * Check if a workspace has PREFILL.md enabled.
 */
export async function hasPrefillEnabled(workspacePath: string): Promise<boolean> {
  const content = await readPrefillContent(workspacePath);
  return content !== undefined;
}

/**
 * Strip prefill content from the start of an assistant response.
 * Returns the response without the prefill portion.
 */
export function stripPrefillFromResponse(
  response: string,
  prefillContent: string | undefined,
): string {
  if (!prefillContent || !response) {
    return response;
  }

  // Simple prefix match
  if (response.startsWith(prefillContent)) {
    return response.slice(prefillContent.length).trimStart();
  }

  // More lenient: normalize whitespace and check
  const normalizedPrefill = prefillContent.replace(/\s+/g, " ").trim();
  const normalizedResponse = response.replace(/\s+/g, " ").trim();

  if (normalizedResponse.startsWith(normalizedPrefill)) {
    // Find where the normalized prefill ends in the original response
    // This is tricky, so we use a simpler heuristic:
    // Count tokens (words) in prefill and skip that many from response
    const prefillWords = prefillContent.split(/\s+/).length;
    const responseWords = response.split(/\s+/);

    if (responseWords.length > prefillWords) {
      return responseWords.slice(prefillWords).join(" ").trimStart();
    }
  }

  // If no match, return original (prefill might not have been used)
  return response;
}
