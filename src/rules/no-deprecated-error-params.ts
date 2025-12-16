import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodCall, DEPRECATED_ERROR_PARAMS } from "../utils/zod-helpers"

type MessageIds = "deprecatedErrorParam"

export const noDeprecatedErrorParams = createRule<[], MessageIds>({
  name: "no-deprecated-error-params",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated error params (invalid_type_error, required_error) in favor of the 'error' param",
    },
    fixable: "code",
    schema: [],
    messages: {
      deprecatedErrorParam:
        "'{{ param }}' is deprecated in Zod v4. Use the 'error' parameter instead: { error: '...' } or { error: (iss) => '...' }",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isZodCall(node)) return

        // Check each argument for deprecated error params
        for (const arg of node.arguments) {
          if (arg.type !== "ObjectExpression") continue

          for (const prop of arg.properties) {
            if (prop.type !== "Property") continue
            if (prop.key.type !== "Identifier") continue

            const paramName = prop.key.name

            if (
              DEPRECATED_ERROR_PARAMS.includes(
                paramName as (typeof DEPRECATED_ERROR_PARAMS)[number]
              )
            ) {
              context.report({
                node: prop,
                messageId: "deprecatedErrorParam",
                data: { param: paramName },
                fix(fixer) {
                  // Simple fix: rename the property to 'error'
                  // Note: This is a simplified fix. In real cases, you might need
                  // to handle the case where both params exist or restructure the error
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

export default noDeprecatedErrorParams
