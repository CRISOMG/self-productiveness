Here is the simplified, cleaner version using English variable names and comments. It maintains the same robust logic (counting brackets) but is more concise.

```javascript
const extractContent = (inputStr) => {
  // 1. Find where the technical block starts
  const start = inputStr.indexOf("[");
  if (start === -1) return { technical: null, message: inputStr };

  let depth = 0;

  // 2. Loop through the string to find the balancing closing bracket
  for (let i = start; i < inputStr.length; i++) {
    if (inputStr[i] === "[") depth++;
    if (inputStr[i] === "]") depth--;

    // 3. When depth hits 0, we found the matching closing bracket
    if (depth === 0) {
      return {
        technical: inputStr.substring(start, i + 1),
        message: inputStr.substring(i + 1).trim(), // Removes leading newlines/spaces
      };
    }
  }

  // Fallback if brackets are malformed
  return { technical: null, message: inputStr };
};

// --- USAGE EXAMPLE ---
// const text = $input.item.json.content; // If using n8n
const text = `Result: [{"id": 1, "data": [1,2]}] ### Actual Project Status [USE PRO]`;

const result = extractContent(text);

console.log("Technical:", result.technical);
// Output: [{"id": 1, "data": [1,2]}]

console.log("Message:", result.message);
// Output: ### Actual Project Status [USE PRO]
```

### Key Changes:

1. **Renamed variables:** `nivel` → `depth` (standard term for nesting), `parteTecnica` → `technical`.
2. **Simplified Logic:** Removed the secondary checks for `endIndex`. If we hit `depth === 0`, we return immediately.
3. **Clean Output:** Added `.trim()` to the message to automatically remove the space or newline before `###`.
