import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"

type MessageIds = "deprecatedErrorsProperty"

export const noErrorsProperty = createRule<[], MessageIds>({
  name: "no-errors-property",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow accessing .errors property on ZodError (use .issues instead)",
    },
    fixable: "code",
    schema: [],
    messages: {
      deprecatedErrorsProperty:
        "ZodError.errors is renamed to ZodError.issues in Zod v4. Use .issues instead of .errors.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        // Check if accessing .errors property
        if (node.property.type !== "Identifier") return
        if (node.property.name !== "errors") return

        // Check if this looks like it's on a ZodError or result.error
        const object = node.object

        // Pattern 1: error.errors (direct)
        if (object.type === "Identifier") {
          const name = object.name.toLowerCase()
          if (
            name === "error" ||
            name === "err" ||
            name === "e" ||
            name === "zoderror" ||
            name === "validationerror"
          ) {
            context.report({
              node: node.property,
              messageId: "deprecatedErrorsProperty",
              fix(fixer) {
                return fixer.replaceText(node.property, "issues")
              },
            })
          }
        }

        // Pattern 2: result.error.errors
        if (
          object.type === "MemberExpression" &&
          object.property.type === "Identifier" &&
          object.property.name === "error"
        ) {
          context.report({
            node: node.property,
            messageId: "deprecatedErrorsProperty",
            fix(fixer) {
              return fixer.replaceText(node.property, "issues")
            },
          })
        }
      },
    }
  },
})

export default noErrorsProperty
