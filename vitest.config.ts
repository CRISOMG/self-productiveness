import { defineConfig } from "vitest/config";
import {
  defineVitestConfig,
  defineVitestProject,
} from "@nuxt/test-utils/config";

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
    setupFiles: ["test/setup.ts"],
    environment: "nuxt",
    include: ["test/nuxt/*.{test,spec}.ts", "test/nuxt/**/*.{test,spec}.ts"],
  },
});
