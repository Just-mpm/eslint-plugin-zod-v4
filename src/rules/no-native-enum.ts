import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"

type MessageIds = "deprecatedNativeEnum"

export const noNativeEnum = createRule<[], MessageIds>({
  name: "no-native-enum",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow z.nativeEnum() in favor of z.enum() which now supports native enums",
    },
    schema: [],
    messages: {
      deprecatedNativeEnum:
        "z.nativeEnum() is deprecated in Zod v4. Use z.enum() instead, which now supports native TypeScript enums directly.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const { object, property } = node.callee

        // Check for z.nativeEnum()
        if (object.type !== "Identifier" || object.name !== "z") return
        if (property.type !== "Identifier" || property.name !== "nativeEnum") return

        context.report({
          node,
          messageId: "deprecatedNativeEnum",
        })
      },
    }
  },
})

export default noNativeEnum
