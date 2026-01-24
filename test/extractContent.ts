// // Simplified extraction logic derived from test/extractContent.md BUT improved for string safety
// export const extractContent = (inputStr: string) => {
//   // 1. Find where the technical block starts
//   const start = inputStr.indexOf("[");
//   if (start === -1) return { technical: null, message: inputStr };

//   let depth = 0;
//   let inString = false;
//   let isEscaped = false;

//   // 2. Loop through the string to find the balancing closing bracket
//   for (let i = start; i < inputStr.length; i++) {
//     const char = inputStr[i];

//     if (inString) {
//       if (isEscaped) {
//         isEscaped = false;
//       } else if (char === "\\") {
//         isEscaped = true;
//       } else if (char === '"') {
//         inString = false; // toggles out of string
//       }
//     } else {
//       if (char === '"') {
//         inString = true; // toggles into string
//       } else if (char === "[") {
//         depth++;
//       } else if (char === "]") {
//         depth--;
//       }
//     }

//     // 3. When depth hits 0, we found the matching closing bracket
//     if (depth === 0) {
//       return {
//         technical: inputStr.substring(start, i + 1),
//         message: inputStr.substring(i + 1).trim(), // Removes leading newlines/spaces
//       };
//     }
//   }

//   // Debug if failed
//   console.log(
//     `ExtractContent Failed: Start ${start}, EndDepth ${depth}, Length ${inputStr.length}`,
//   );

//   // Fallback if brackets are malformed
//   return { technical: null, message: inputStr };
// };

export const extractContent = (inputStr: string) => {
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
