export type MessageComponent =
  | { type: "text"; content: string; log?: never }
  | { type: "log"; log: any; content?: never };

export function parseMessageComponents(text: string): MessageComponent[] {
  const components: MessageComponent[] = [];
  // Regex to find the start of a tool block
  const toolStartRegex = /(?:\[?Used tools: )|(?:Calling (.*?) with input: )/g;

  let lastIndex = 0;
  let match;

  while ((match = toolStartRegex.exec(text)) !== null) {
    // Add text preceding the tool block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent.trim()) {
        components.push({ type: "text", content: textContent });
      } else if (textContent.includes("\n")) {
        // Preserve significant whitespace if it's structural?
        // For chat, usually trimming surrounding whitespace of tools is fine,
        // but let's keep it if it's large.
        // Actually, let's just push it.
        components.push({ type: "text", content: textContent });
      }
    }

    // Check which format we matched
    const isUsedTools = match[0].includes("Used tools");

    if (isUsedTools) {
      // --- Format 1: [Used tools: ...] or Used tools: ... ---
      // We need to capture content until the block closes.
      // If it started with '[', we assume it's a bracketed block and we need to balance it.
      // If no '[', it might just go to end of line? Or end of string?
      // Usually "Used tools:" format without brackets isn't standard in your logs,
      // but let's assume it behaves like valid text if no brackets.
      // But the regex '\[?' allows optional.

      const startsWithBracket = match[0].startsWith("[");
      let balance = startsWithBracket ? 1 : 0;
      let currentIndex = toolStartRegex.lastIndex;
      let contentEndIndex = currentIndex;

      let inString = false;
      let isEscaped = false;

      // Scan forward
      for (let i = currentIndex; i < text.length; i++) {
        const char = text[i];

        if (inString) {
          if (isEscaped) {
            isEscaped = false;
          } else if (char === "\\") {
            isEscaped = true;
          } else if (char === '"') {
            inString = false;
          }
        } else {
          if (char === '"') {
            inString = true;
          } else if (char === "[") {
            balance++;
          } else if (char === "]") {
            balance--;
          }
        }

        if (balance === 0 && !inString) {
          contentEndIndex = i;
          break;
        }

        // Heuristic: If we hit "###" outside of a string, it's likely the start of the response content
        // This handles cases where the closing bracket ']' is missing in the log
        if (
          !inString &&
          text[i] === "#" &&
          text[i + 1] === "#" &&
          text[i + 2] === "#"
        ) {
          contentEndIndex = i;
          break;
        }

        // If we reach the end, we just take everything
        contentEndIndex = i + 1;
      }

      const content = text.slice(currentIndex, contentEndIndex);

      // Parse the content for multiple tools (separated by "; Tool:")
      const tools = content.split(/; (?=Tool:)/);
      tools.forEach((toolStr) => {
        const toolMatch = toolStr.match(
          /Tool: ([\s\S]*?), Input: ([\s\S]*?), Result: ([\s\S]*)/,
        );
        if (toolMatch) {
          components.push({
            type: "log",
            log: {
              tool: toolMatch[1] || "",
              input: toolMatch[2] || "",
              result: toolMatch[3] || "",
            },
          });
        } else {
          // Fallback
          const simpleMatch = toolStr.match(
            /^Tool: (.*?), Input: (.*?), Result: (.*)$/,
          );
          if (simpleMatch) {
            components.push({
              type: "log",
              log: {
                tool: simpleMatch[1],
                input: simpleMatch[2],
                result: simpleMatch[3],
              },
            });
          }
        }
      });

      // Update indices
      // If we stopped at a closing bracket, skips it
      lastIndex =
        balance === 0 && startsWithBracket
          ? contentEndIndex + 1
          : contentEndIndex;
      toolStartRegex.lastIndex = lastIndex;
    } else {
      // --- Format 2: Calling <Tool> with input: ... ---
      // We capture everything until the start of the NEXT tool block or End of String.

      const toolName = match[1];
      const startIndex = toolStartRegex.lastIndex;

      // Find where the next tool might start
      // We use a non-stateful regex search to find the nearest next occurrence
      const nextToolRegex = /(?:\[?Used tools: )|(?:Calling .*? with input: )/g;
      nextToolRegex.lastIndex = startIndex;
      const nextMatch = nextToolRegex.exec(text);

      let endIndex = nextMatch ? nextMatch.index : text.length;

      // Fix: Check if input merges with response (e.g. JSON ending with } followed by ###)
      // We look for the pattern "}<whitespace>###" within the captured segment
      const inputSegment = text.slice(startIndex, endIndex);
      // Regex finds the first closing brace followed immediately (or with whitespace) by ###
      // This is a strong signal that the JSON input ended and the Markdown response began.
      const splitMatch = inputSegment.match(/}(\s*)###/);

      if (splitMatch && splitMatch.index !== undefined) {
        // The input ends right after the brace '}'
        // splitMatch.index is the start of '}', so we add 1 to include it.
        endIndex = startIndex + splitMatch.index + 1;
      }

      const inputContent = text.slice(startIndex, endIndex);

      components.push({
        type: "log",
        log: {
          tool: toolName || "",
          input: inputContent || "",
          result: "",
        },
      });

      lastIndex = endIndex;
      toolStartRegex.lastIndex = lastIndex;
    }
  }

  // Add any remaining text after the last tool
  if (lastIndex < text.length) {
    components.push({ type: "text", content: text.slice(lastIndex) });
  }

  return components.length > 0 ? components : [{ type: "text", content: text }];
}
