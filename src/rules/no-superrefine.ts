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
    fixable: "code",
    schema: [],
    messages: {
      deprecatedSuperRefine:
        ".superRefine() is deprecated in Zod v4. Use .check() instead.\n\n" +
        "Migration pattern:\n" +
        "// Before (Zod v3):\n" +
        ".superRefine((data, ctx) => {\n" +
        "  ctx.addIssue({ code: 'custom', message: '...' });\n" +
        "})\n\n" +
        "// After (Zod v4):\n" +
        ".check((ctx) => {\n" +
        "  const { value: data } = ctx;\n" +
        "  ctx.addIssue({ code: 'custom', message: '...' });\n" +
        "})",
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

        // Try to create auto-fix if possible
        const callback = node.arguments[0]

        context.report({
          node,
          messageId: "deprecatedSuperRefine",
          fix(fixer) {
            // Only auto-fix if we have a callback argument
            if (!callback) return null

            // Get the method name position to replace 'superRefine' with 'check'
            const memberExpr = node.callee as TSESTree.MemberExpression
            const property = memberExpr.property

            if (property.type !== "Identifier") return null

            // Check if callback is an arrow function or function expression
            if (
              callback.type !== "ArrowFunctionExpression" &&
              callback.type !== "FunctionExpression"
            ) {
              // Can't auto-fix if it's a variable reference
              return null
            }

            const params = callback.params

            // We need at least the data param, ctx is optional but common
            if (params.length === 0) {
              // No params, just replace method name
              return fixer.replaceText(property, "check")
            }

            const sourceCode = context.sourceCode

            // Get param names
            const firstParam = params[0]
            const secondParam = params[1]

            // If there's only one param, we assume it's ctx (the Zod v4 pattern)
            // or it's data and we need to transform
            if (params.length === 1 && firstParam) {
              const paramName = sourceCode.getText(firstParam)

              // Heuristic: if param is named 'ctx' or 'context', it's already v4 style
              if (paramName === "ctx" || paramName === "context") {
                return fixer.replaceText(property, "check")
              }

              // Otherwise, assume it's 'data' and we need to wrap it
              // Transform: .superRefine((data) => { ... })
              // To: .check((ctx) => { const { value: data } = ctx; ... })
              if (callback.body.type === "BlockStatement") {
                const bodyStart = callback.body.range[0] + 1 // After '{'
                const dataDecl = ` const { value: ${paramName} } = ctx;`

                return [
                  fixer.replaceText(property, "check"),
                  fixer.replaceText(firstParam, "ctx"),
                  fixer.insertTextAfterRange([bodyStart, bodyStart], dataDecl),
                ]
              }

              return fixer.replaceText(property, "check")
            }

            // Two params: (data, ctx) => { ... }
            // Transform to: (ctx) => { const { value: data } = ctx; ... }
            if (params.length >= 2 && firstParam && secondParam) {
              const dataParamName = sourceCode.getText(firstParam)
              const ctxParamName = sourceCode.getText(secondParam)

              if (callback.body.type === "BlockStatement") {
                const bodyStart = callback.body.range[0] + 1 // After '{'

                // Determine the variable name for destructuring
                // If ctx param is 'ctx', use it; otherwise rename
                const useCtxName = ctxParamName === "ctx" ? "ctx" : ctxParamName
                const dataDecl = ` const { value: ${dataParamName} } = ${useCtxName};`

                // Get the range of params to replace "(data, ctx)" with "(ctx)"
                const paramsStart = firstParam.range[0]
                const paramsEnd = secondParam.range[1]

                return [
                  fixer.replaceText(property, "check"),
                  fixer.replaceTextRange([paramsStart, paramsEnd], useCtxName),
                  fixer.insertTextAfterRange([bodyStart, bodyStart], dataDecl),
                ]
              }

              // Expression body - can't easily auto-fix
              return fixer.replaceText(property, "check")
            }

            // Default: just replace method name
            return fixer.replaceText(property, "check")
          },
        })
      },
    }
  },
})

export default noSuperRefine
