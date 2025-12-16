import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "deprecatedSuperRefine"

export const noSuperRefine = createRule<[], MessageIds>({
  name: "no-superrefine",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated .superRefine() method in favor of .check()",
    },
    schema: [],
    messages: {
      deprecatedSuperRefine:
        ".superRefine() is deprecated in Zod v4. Use .check() instead for custom validations.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (methodName !== "superRefine") return

        // Check if this is called on a Zod schema (direct or variable)
        if (!isLikelyZodSchemaCall(node)) return

        context.report({
          node,
          messageId: "deprecatedSuperRefine",
        })
      },
    }
  },
})

export default noSuperRefine
