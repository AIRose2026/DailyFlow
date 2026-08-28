import nextConfig from "eslint-config-next";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = [
  ...nextConfig,
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      // Our Supabase data hooks intentionally fetch-on-mount via
      // `useEffect(() => { refresh() }, [refresh])`, the standard pattern for
      // client-side data loading without a dedicated fetching library. This
      // new (react-hooks v7 / compiler-oriented) rule flags that pattern
      // categorically; revisit if the app adopts SWR/React Query.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
];

export default eslintConfig;
