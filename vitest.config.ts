import { defineConfig } from "vitest/config";
import {
  defineVitestConfig,
  defineVitestProject,
} from "@nuxt/test-utils/config";
import { fileURLToPath } from "node:url";

// export default defineConfig({
//   test: {
//     projects: [
//       {
//         test: {
//           name: "unit",
//           include: ["test/{e2e,unit}/*.{test,spec}.ts"],
//           environment: "node",
//         },
//       },
//       await defineVitestProject({
//         test: {
//           name: "nuxt",
//           include: [
//             "test/nuxt/*.{test,spec}.ts",
//             "test/nuxt/**/*.{test,spec}.ts",
//           ],
//           environment: "nuxt",
//         },
//       }),
//     ],
// });

export default defineVitestConfig({
  test: {
    setupFiles: [fileURLToPath(new URL("./test/setup.ts", import.meta.url))],
    environment: "nuxt",
    include: [
      fileURLToPath(new URL("./test/**/*.{test,spec}.ts", import.meta.url)),
    ],
  },
});
