import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "removedDeepPartial"

export const noDeepPartial = createRule<[], MessageIds>({
  name: "no-deep-partial",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow .deepPartial() which was removed in Zod v4",
    },
    schema: [],
    messages: {
      removedDeepPartial:
        ".deepPartial() was removed in Zod v4. Consider using .partial() for shallow partial or manually creating nested partial schemas.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (methodName !== "deepPartial") return

        // Check if this is called on a Zod schema
        if (!isLikelyZodSchemaCall(node)) return

        context.report({
          node,
          messageId: "removedDeepPartial",
        })
      },
    }
  },
})

export default noDeepPartial
