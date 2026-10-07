import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // VISION §7: screens never import fixtures. They call services.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/fixtures", "@/fixtures/*", "**/fixtures/*"],
              message: "Screens never import fixtures. Read data through lib/care or call services.",
            },
            {
              group: ["@/services/mock/*", "**/services/mock/*"],
              message: "Use the implementations chosen in @/services, not mocks directly.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
