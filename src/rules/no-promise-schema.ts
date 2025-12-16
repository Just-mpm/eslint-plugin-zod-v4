import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"

type MessageIds = "deprecatedPromise"

export const noPromiseSchema = createRule<[], MessageIds>({
  name: "no-promise-schema",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow z.promise() which is deprecated in Zod v4",
    },
    schema: [],
    messages: {
      deprecatedPromise:
        "z.promise() is deprecated in Zod v4. Await your promises before parsing instead of wrapping schemas with z.promise().",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const { object, property } = node.callee

        // Check for z.promise()
        if (object.type !== "Identifier" || object.name !== "z") return
        if (property.type !== "Identifier" || property.name !== "promise") return

        context.report({
          node,
          messageId: "deprecatedPromise",
        })
      },
    }
  },
})

export default noPromiseSchema
