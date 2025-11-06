import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".bmad-core/**",
      "bmad/**", // Ignore BMAD framework files
      "bmad-docs/**", // Ignore BMAD documentation
      "scripts/**/*.js",
      "*.js", // Ignore root-level JS files (migration scripts, etc.)
    ],
  },
];

export default eslintConfig;
