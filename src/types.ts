import type { TSESLint } from "@typescript-eslint/utils"

/**
 * Rule severity levels
 */
export type RuleSeverity = "off" | "warn" | "error"

/**
 * Rule configuration
 */
export type RuleConfig = RuleSeverity | [RuleSeverity, ...unknown[]]

/**
 * Plugin rule module
 */
export type RuleModule = TSESLint.RuleModule<string, unknown[]>

/**
 * Plugin rules record
 */
export type PluginRules = Record<string, RuleModule>

/**
 * Plugin config
 */
export interface PluginConfig {
  plugins?: Record<string, unknown>
  rules?: Record<string, RuleConfig>
}

/**
 * Plugin meta information
 */
export interface PluginMeta {
  name: string
  version: string
}

/**
 * Full plugin structure
 */
export interface Plugin {
  meta: PluginMeta
  configs: Record<string, PluginConfig>
  rules: PluginRules
}
