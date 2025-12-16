import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { DEPRECATED_ZOD_ERROR_METHODS, getMethodName } from "../utils/zod-helpers"

type MessageIds = "deprecatedFormatMethod"

export const noDeprecatedFormatMethods = createRule<[], MessageIds>({
  name: "no-deprecated-format-methods",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated .format() and .flatten() methods on ZodError in favor of z.treeifyError()",
    },
    schema: [],
    messages: {
      deprecatedFormatMethod:
        ".{{ method }}() on ZodError is deprecated in Zod v4. Use z.treeifyError(error) instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (!methodName) return

        if (
          !DEPRECATED_ZOD_ERROR_METHODS.includes(
            methodName as (typeof DEPRECATED_ZOD_ERROR_METHODS)[number]
          )
        ) {
          return
        }

        // Check if this is likely called on a ZodError
        // We look for common patterns:
        // 1. error.format() / error.flatten()
        // 2. result.error.format() / result.error.flatten()
        // 3. e.format() / e.flatten() (in catch blocks)

        const object = node.callee.object

        // Pattern: result.error.format()
        if (
          object.type === "MemberExpression" &&
          object.property.type === "Identifier" &&
          object.property.name === "error"
        ) {
          context.report({
            node,
            messageId: "deprecatedFormatMethod",
            data: { method: methodName },
          })
          return
        }

        // Pattern: error.format() or e.format() where variable might be ZodError
        // This is a heuristic - we can't be 100% sure without type information
        if (object.type === "Identifier") {
          const name = object.name.toLowerCase()
          if (
            name === "error" ||
            name === "err" ||
            name === "e" ||
            name === "zoderror"
          ) {
            context.report({
              node,
              messageId: "deprecatedFormatMethod",
              data: { method: methodName },
            })
          }
        }
      },
    }
  },
})

export default noDeprecatedFormatMethods
