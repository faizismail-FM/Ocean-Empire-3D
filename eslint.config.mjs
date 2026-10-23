import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts", "coverage/**"],
  },
  {
    rules: {
      // React Three Fiber uses JSX intrinsic elements (mesh, group, ...) that the
      // unknown-property rule does not understand.
      "react/no-unknown-property": "off",
    },
  },
];

export default eslintConfig;
