import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "deprecatedMerge"

export const noMergeMethod = createRule<[], MessageIds>({
  name: "no-merge-method",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated .merge() method in favor of .extend() or spread syntax",
    },
    schema: [],
    messages: {
      deprecatedMerge:
        ".merge() is deprecated in Zod v4. Use .extend() instead: schema.extend(otherSchema.shape) or use the spread operator in z.object({ ...schema1.shape, ...schema2.shape })",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (methodName !== "merge") return

        // Check if this is called on a Zod schema (direct or variable)
        if (!isLikelyZodSchemaCall(node)) return

        context.report({
          node,
          messageId: "deprecatedMerge",
        })
      },
    }
  },
})

export default noMergeMethod
