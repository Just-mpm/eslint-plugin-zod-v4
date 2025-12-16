import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import {
  ZOD_TOP_LEVEL_FORMATS,
  isZodChainCall,
  getMethodName,
} from "../utils/zod-helpers"

type MessageIds = "deprecatedStringFormat"

export const noDeprecatedStringFormat = createRule<[], MessageIds>({
  name: "no-deprecated-string-format",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow deprecated string format methods like z.string().email() in favor of top-level z.email()",
    },
    fixable: "code",
    schema: [],
    messages: {
      deprecatedStringFormat:
        "z.string().{{ method }}() is deprecated in Zod v4. Use z.{{ method }}() instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Check if this is a method call on a chain
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (!methodName) return

        // Check if the method is one of the deprecated string formats
        if (
          !ZOD_TOP_LEVEL_FORMATS.includes(
            methodName as (typeof ZOD_TOP_LEVEL_FORMATS)[number]
          )
        ) {
          return
        }

        // Check if this is called on a Zod chain
        if (!isZodChainCall(node)) return

        // Check if the object is z.string() or a chain starting with z.string()
        const object = node.callee.object
        if (object.type !== "CallExpression") return

        // Traverse to find if z.string() is in the chain
        let current: TSESTree.Node = object
        let foundString = false

        while (current.type === "CallExpression") {
          if (current.callee.type === "MemberExpression") {
            const obj = current.callee.object
            const prop = current.callee.property

            if (
              obj.type === "Identifier" &&
              obj.name === "z" &&
              prop.type === "Identifier" &&
              prop.name === "string"
            ) {
              foundString = true
              break
            }

            current = current.callee.object
          } else {
            break
          }
        }

        if (!foundString) return

        // Check if z.string() has arguments (like min/max constraints)
        // In that case, we can't simply replace with z.email()
        const stringCall = findStringCall(object)
        if (stringCall && hasChainedConstraints(stringCall, node)) {
          // Has constraints, report but don't auto-fix
          context.report({
            node,
            messageId: "deprecatedStringFormat",
            data: { method: methodName },
          })
          return
        }

        context.report({
          node,
          messageId: "deprecatedStringFormat",
          data: { method: methodName },
          fix(fixer) {
            // Get the arguments from the deprecated method call
            const args = node.arguments
            const argsText =
              args.length > 0
                ? context.sourceCode.getText().slice(args[0]!.range[0], args[args.length - 1]!.range[1])
                : ""

            // Replace the entire chain with z.method()
            const replacement = argsText
              ? `z.${methodName}(${argsText})`
              : `z.${methodName}()`

            return fixer.replaceText(node, replacement)
          },
        })
      },
    }
  },
})

/**
 * Find the z.string() call in a chain
 */
function findStringCall(
  node: TSESTree.CallExpression
): TSESTree.CallExpression | undefined {
  let current: TSESTree.Node = node

  while (current.type === "CallExpression") {
    if (current.callee.type === "MemberExpression") {
      const obj = current.callee.object
      const prop = current.callee.property

      if (
        obj.type === "Identifier" &&
        obj.name === "z" &&
        prop.type === "Identifier" &&
        prop.name === "string"
      ) {
        return current
      }

      current = current.callee.object
    } else {
      break
    }
  }

  return undefined
}

/**
 * Check if there are chained constraints between z.string() and the format method
 */
function hasChainedConstraints(
  stringCall: TSESTree.CallExpression,
  formatCall: TSESTree.CallExpression
): boolean {
  // If z.string() has arguments, it has constraints
  if (stringCall.arguments.length > 0) return true

  // Check if there are methods between z.string() and the format method
  let current: TSESTree.Node = formatCall.callee

  if (current.type !== "MemberExpression") return false

  current = current.object

  // If the direct parent is z.string(), no constraints in between
  if (current === stringCall) return false

  // There are intermediate methods
  return current.type === "CallExpression" && current !== stringCall
}

export default noDeprecatedStringFormat
