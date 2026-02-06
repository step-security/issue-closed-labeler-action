import rollupPluginJSON from "@rollup/plugin-json";
import rollupPluginCommonJS from "@rollup/plugin-commonjs";
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve";
import rollupPluginTypescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",

  output: {
    sourcemap: false,
    file: "dist/index.js",
    format: "esm",
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonJS(),
    rollupPluginTypescript({
      tsconfig: "tsconfig.build.json",
    }),
    rollupPluginJSON({
      preferConst: true,
    }),
  ],

  external: [],

  treeshake: {
    annotations: true,
    moduleSideEffects: [],
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
};
