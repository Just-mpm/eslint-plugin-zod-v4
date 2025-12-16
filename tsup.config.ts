import { defineConfig } from "tsup"

/**
 * ESM Compatibility Banner
 *
 * @typescript-eslint/utils internally uses require() which doesn't exist in ESM.
 * This banner creates a require function using Node's createRequire, allowing
 * the bundled code to work in both ESM and CJS contexts.
 *
 * @see https://github.com/evanw/esbuild/issues/1921
 */
const esmBanner = `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  banner: {
    // Only add the banner to ESM output
    js: esmBanner,
  },
  esbuildOptions(options, context) {
    // Only apply banner to ESM format
    if (context.format === "cjs") {
      options.banner = { js: "" }
    }
  },
})
