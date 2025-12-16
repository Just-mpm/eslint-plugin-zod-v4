import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "deprecatedStrict" | "deprecatedPassthrough" | "deprecatedStrip"

const DEPRECATED_METHODS = {
  strict: {
    messageId: "deprecatedStrict" as const,
    replacement: "z.strictObject()",
  },
  passthrough: {
    messageId: "deprecatedPassthrough" as const,
    replacement: "z.looseObject()",
  },
  strip: {
    messageId: "deprecatedStrip" as const,
    replacement: "z.object(schema.shape)",
  },
}

export const noDeprecatedObjectMethods = createRule<[], MessageIds>({
  name: "no-deprecated-object-methods",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated object methods (.strict(), .passthrough(), .strip()) in favor of top-level functions",
    },
    schema: [],
    messages: {
      deprecatedStrict:
        ".strict() is deprecated in Zod v4. Use z.strictObject() instead to create a strict object schema.",
      deprecatedPassthrough:
        ".passthrough() is deprecated in Zod v4. Use z.looseObject() instead to allow extra properties.",
      deprecatedStrip:
        ".strip() is removed in Zod v4. Use z.object(existingSchema.shape) to create a new schema without extra properties.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (!methodName) return

        const deprecatedMethod = DEPRECATED_METHODS[methodName as keyof typeof DEPRECATED_METHODS]
        if (!deprecatedMethod) return

        // Check if this is called on a Zod schema
        if (!isLikelyZodSchemaCall(node)) return

        context.report({
          node,
          messageId: deprecatedMethod.messageId,
        })
      },
    }
  },
})

export default noDeprecatedObjectMethods
