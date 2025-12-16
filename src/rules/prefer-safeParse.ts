import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "preferSafeParse"

export const preferSafeParse = createRule<[], MessageIds>({
  name: "prefer-safeParse",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer .safeParse() over .parse() to handle validation errors gracefully without throwing",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferSafeParse:
        "Prefer .safeParse() over .parse(). safeParse returns a result object { success, data, error } instead of throwing, making error handling more explicit and predictable.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (methodName !== "parse") return

        // Check if this is called on a Zod schema (direct or variable)
        if (!isLikelyZodSchemaCall(node)) return

        // Check if it's inside a try-catch block
        // If so, we should still suggest safeParse but it's less critical
        const isInTryCatch = isInsideTryCatch(node)

        context.report({
          node,
          messageId: "preferSafeParse",
          fix(fixer) {
            // Only auto-fix if not in try-catch (safer)
            if (isInTryCatch) return null

            // Replace .parse with .safeParse
            const property = node.callee as TSESTree.MemberExpression
            return fixer.replaceText(property.property, "safeParse")
          },
        })
      },
    }
  },
})

/**
 * Check if a node is inside a try-catch block
 */
function isInsideTryCatch(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent

  while (current) {
    if (current.type === "TryStatement") {
      return true
    }
    current = current.parent
  }

  return false
}

export default preferSafeParse
