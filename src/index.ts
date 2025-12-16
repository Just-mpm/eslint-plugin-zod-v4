import type { TSESLint } from "@typescript-eslint/utils"
import type { Plugin, PluginConfig } from "./types"

// Import all rules - Breaking Changes
import { noDeprecatedStringFormat } from "./rules/no-deprecated-string-format"
import { noRecordSingleArg } from "./rules/no-record-single-arg"
import { noDeprecatedErrorParams } from "./rules/no-deprecated-error-params"
import { noDeprecatedFormatMethods } from "./rules/no-deprecated-format-methods"
import { noMergeMethod } from "./rules/no-merge-method"
import { noSuperRefine } from "./rules/no-superrefine"
import { noErrorsProperty } from "./rules/no-errors-property"
import { noDeprecatedObjectMethods } from "./rules/no-deprecated-object-methods"
import { noNativeEnum } from "./rules/no-native-enum"
import { noDeepPartial } from "./rules/no-deep-partial"
import { noDeprecatedIpMethods } from "./rules/no-deprecated-ip-methods"
import { noPromiseSchema } from "./rules/no-promise-schema"

// Import all rules - Best Practices
import { preferSafeParse } from "./rules/prefer-safeParse"
import { noSchemaInRender } from "./rules/no-schema-in-render"
import { preferErrorParam } from "./rules/prefer-error-param"

// Plugin metadata
const meta = {
  name: "eslint-plugin-zod-v4",
  version: "0.1.0",
} as const

// All rules
const rules = {
  // Breaking Changes
  "no-deprecated-string-format": noDeprecatedStringFormat,
  "no-record-single-arg": noRecordSingleArg,
  "no-deprecated-error-params": noDeprecatedErrorParams,
  "no-deprecated-format-methods": noDeprecatedFormatMethods,
  "no-merge-method": noMergeMethod,
  "no-superrefine": noSuperRefine,
  "no-errors-property": noErrorsProperty,
  "no-deprecated-object-methods": noDeprecatedObjectMethods,
  "no-native-enum": noNativeEnum,
  "no-deep-partial": noDeepPartial,
  "no-deprecated-ip-methods": noDeprecatedIpMethods,
  "no-promise-schema": noPromiseSchema,
  // Best Practices
  "prefer-safeParse": preferSafeParse,
  "no-schema-in-render": noSchemaInRender,
  "prefer-error-param": preferErrorParam,
} as const satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>

// Create the plugin object first (needed for self-reference in configs)
const plugin: Plugin = {
  meta,
  rules,
  configs: {} as Record<string, PluginConfig>,
}

// Define configs with self-reference to the plugin
const configs = {
  /**
   * Recommended config - Breaking changes only (errors)
   * Use this to catch code that will break in Zod v4
   */
  recommended: {
    plugins: {
      "zod-v4": plugin,
    },
    rules: {
      "zod-v4/no-deprecated-string-format": "error",
      "zod-v4/no-record-single-arg": "error",
      "zod-v4/no-deprecated-error-params": "error",
      "zod-v4/no-deprecated-format-methods": "error",
      "zod-v4/no-merge-method": "error",
      "zod-v4/no-superrefine": "error",
      "zod-v4/no-errors-property": "error",
      "zod-v4/no-deprecated-object-methods": "error",
      "zod-v4/no-native-enum": "error",
      "zod-v4/no-deep-partial": "error",
      "zod-v4/no-deprecated-ip-methods": "error",
      "zod-v4/no-promise-schema": "error",
    },
  },
  /**
   * Strict config - Recommended + Best practices (warnings)
   * Use this to enforce best practices alongside breaking changes
   */
  strict: {
    plugins: {
      "zod-v4": plugin,
    },
    rules: {
      // Breaking changes (errors)
      "zod-v4/no-deprecated-string-format": "error",
      "zod-v4/no-record-single-arg": "error",
      "zod-v4/no-deprecated-error-params": "error",
      "zod-v4/no-deprecated-format-methods": "error",
      "zod-v4/no-merge-method": "error",
      "zod-v4/no-superrefine": "error",
      "zod-v4/no-errors-property": "error",
      "zod-v4/no-deprecated-object-methods": "error",
      "zod-v4/no-native-enum": "error",
      "zod-v4/no-deep-partial": "error",
      "zod-v4/no-deprecated-ip-methods": "error",
      "zod-v4/no-promise-schema": "error",
      // Best practices (warnings)
      "zod-v4/prefer-safeParse": "warn",
      "zod-v4/no-schema-in-render": "warn",
      "zod-v4/prefer-error-param": "warn",
    },
  },
  /**
   * All config - All rules enabled as errors
   * Use this for maximum strictness
   */
  all: {
    plugins: {
      "zod-v4": plugin,
    },
    rules: {
      "zod-v4/no-deprecated-string-format": "error",
      "zod-v4/no-record-single-arg": "error",
      "zod-v4/no-deprecated-error-params": "error",
      "zod-v4/no-deprecated-format-methods": "error",
      "zod-v4/no-merge-method": "error",
      "zod-v4/no-superrefine": "error",
      "zod-v4/no-errors-property": "error",
      "zod-v4/no-deprecated-object-methods": "error",
      "zod-v4/no-native-enum": "error",
      "zod-v4/no-deep-partial": "error",
      "zod-v4/no-deprecated-ip-methods": "error",
      "zod-v4/no-promise-schema": "error",
      "zod-v4/prefer-safeParse": "error",
      "zod-v4/no-schema-in-render": "error",
      "zod-v4/prefer-error-param": "error",
    },
  },
} as const satisfies Record<string, PluginConfig>

// Assign configs to plugin
Object.assign(plugin.configs, configs)

// Export plugin as default
export default plugin

// Named exports for convenience
export { meta, rules, configs }

// Export individual rules for direct use
export {
  // Breaking Changes
  noDeprecatedStringFormat,
  noRecordSingleArg,
  noDeprecatedErrorParams,
  noDeprecatedFormatMethods,
  noMergeMethod,
  noSuperRefine,
  noErrorsProperty,
  noDeprecatedObjectMethods,
  noNativeEnum,
  noDeepPartial,
  noDeprecatedIpMethods,
  noPromiseSchema,
  // Best Practices
  preferSafeParse,
  noSchemaInRender,
  preferErrorParam,
}
