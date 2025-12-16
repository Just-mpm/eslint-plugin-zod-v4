import { ESLintUtils } from "@typescript-eslint/utils"

/**
 * Create a rule with proper typing and documentation URL
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Just-mpm/eslint-plugin-zod-v4/blob/main/docs/rules/${name}.md`
)
