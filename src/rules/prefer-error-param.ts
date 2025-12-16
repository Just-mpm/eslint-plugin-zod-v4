import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodCall } from "../utils/zod-helpers"

type MessageIds = "preferErrorParam"

export const preferErrorParam = createRule<[], MessageIds>({
  name: "prefer-error-param",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer 'error' parameter over 'message' for error customization in Zod v4",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferErrorParam:
        "The 'message' parameter is deprecated in Zod v4. Use 'error' instead: { error: '...' } or { error: (iss) => '...' }",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isZodCall(node)) return

        // Check each argument for 'message' param
        for (const arg of node.arguments) {
          if (arg.type !== "ObjectExpression") continue

          for (const prop of arg.properties) {
            if (prop.type !== "Property") continue
            if (prop.key.type !== "Identifier") continue

            if (prop.key.name === "message") {
              context.report({
                node: prop,
                messageId: "preferErrorParam",
                fix(fixer) {
                  return fixer.replaceText(prop.key, "error")
                },
              })
            }
          }
        }
      },
    }
  },
})

export default preferErrorParam
