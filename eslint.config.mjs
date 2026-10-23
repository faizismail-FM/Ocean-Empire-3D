import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
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
