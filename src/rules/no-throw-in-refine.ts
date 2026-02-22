import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isLikelyZodSchemaCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "throwInRefine" | "throwInSuperRefine" | "throwInTransform"

const TARGET_METHODS = ["refine", "superRefine", "transform"] as const
type TargetMethod = (typeof TARGET_METHODS)[number]

/**
 * Check if a throw statement is inside a try-catch block
 */
function isInsideTryCatch(node: TSESTree.ThrowStatement): boolean {
  let current: TSESTree.Node | undefined = node.parent

  while (current) {
    // Stop at function boundaries - we don't want to cross into parent functions
    if (
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionExpression" ||
      current.type === "FunctionDeclaration"
    ) {
      break
    }

    if (current.type === "TryStatement") {
      // Check if the throw is inside the try block (not catch or finally)
      // Walk up from node to see if we pass through the try block
      let checkNode: TSESTree.Node | undefined = node.parent
      while (checkNode && checkNode !== current) {
        if (checkNode === current.block) return true
        checkNode = checkNode.parent
      }
    }

    current = current.parent
  }

  return false
}

/**
 * Check if a throw statement is inside a nested function within the callback
 * (i.e., not directly in the callback's scope)
 */
function isInsideNestedFunction(
  throwNode: TSESTree.ThrowStatement,
  callback: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): boolean {
  let current: TSESTree.Node | undefined = throwNode.parent

  while (current && current !== callback) {
    if (
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionExpression" ||
      current.type === "FunctionDeclaration"
    ) {
      return true // It's inside a nested function
    }
    current = current.parent
  }

  return false // It's directly in the callback's scope
}

/**
 * Find all ThrowStatements in a node's body (direct scope only, not nested functions)
 */
function findThrowStatements(
  node: TSESTree.Node
): TSESTree.ThrowStatement[] {
  const throwStatements: TSESTree.ThrowStatement[] = []

  function traverse(current: TSESTree.Node, inNestedFunction: boolean): void {
    // Stop traversing if we enter a nested function
    if (
      (current.type === "ArrowFunctionExpression" ||
        current.type === "FunctionExpression" ||
        current.type === "FunctionDeclaration") &&
      current !== node
    ) {
      return
    }

    if (current.type === "ThrowStatement" && !inNestedFunction) {
      throwStatements.push(current)
      return
    }

    // Skip try blocks - throws inside try are handled
    if (current.type === "TryStatement") {
      // Only traverse catch and finally blocks, not try block
      if (current.handler) {
        traverse(current.handler, inNestedFunction)
      }
      if (current.finalizer) {
        traverse(current.finalizer, inNestedFunction)
      }
      return
    }

    // Traverse children
    for (const key of Object.keys(current)) {
      if (key === "parent" || key === "loc" || key === "range") continue

      const value = (current as unknown as Record<string, unknown>)[key]
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item as TSESTree.Node, inNestedFunction)
            }
          }
        } else if ("type" in value) {
          traverse(value as TSESTree.Node, inNestedFunction)
        }
      }
    }
  }

  traverse(node, false)
  return throwStatements
}

/**
 * Get the message ID based on the method name
 */
function getMessageId(methodName: TargetMethod): MessageIds {
  switch (methodName) {
    case "refine":
      return "throwInRefine"
    case "superRefine":
      return "throwInSuperRefine"
    case "transform":
      return "throwInTransform"
  }
}

export const noThrowInRefine = createRule<[], MessageIds>({
  name: "no-throw-in-refine",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow throw statements inside .refine(), .superRefine(), and .transform() callbacks",
    },
    schema: [],
    messages: {
      throwInRefine:
        "Throwing inside .refine() is not captured by Zod. Return a falsy value to signal validation failure instead.\n\n" +
        "// ❌ Bad:\n" +
        ".refine((val) => {\n" +
        "  if (!isValid(val)) throw new Error('Invalid');\n" +
        "  return true;\n" +
        "})\n\n" +
        "// ✅ Good:\n" +
        ".refine((val) => isValid(val) || 'Invalid value')",
      throwInSuperRefine:
        "Throwing inside .superRefine() is not captured by Zod. Use ctx.addIssue() to report validation errors instead.\n\n" +
        "// ❌ Bad:\n" +
        ".superRefine((val, ctx) => {\n" +
        "  if (!isValid(val)) throw new Error('Invalid');\n" +
        "})\n\n" +
        "// ✅ Good:\n" +
        ".superRefine((val, ctx) => {\n" +
        "  if (!isValid(val)) {\n" +
        "    ctx.addIssue({ code: 'custom', message: 'Invalid' });\n" +
        "  }\n" +
        "})",
      throwInTransform:
        "Throwing inside .transform() is not captured by Zod. Use ctx.issues.push() and return z.NEVER instead.\n\n" +
        "// ❌ Bad:\n" +
        ".transform((val) => {\n" +
        "  if (!val) throw new Error('Invalid');\n" +
        "  return processed;\n" +
        "})\n\n" +
        "// ✅ Good:\n" +
        ".transform((val, ctx) => {\n" +
        "  if (!val) {\n" +
        "    ctx.issues.push({ code: 'custom', message: 'Invalid' });\n" +
        "    return z.NEVER;\n" +
        "  }\n" +
        "  return processed;\n" +
        "})",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)
        if (!methodName || !TARGET_METHODS.includes(methodName as TargetMethod)) return

        // Check if this is called on a Zod schema (direct or variable)
        if (!isLikelyZodSchemaCall(node)) return

        // Get the callback argument
        const callback = node.arguments[0]
        if (!callback) return

        // Only analyze function expressions with block bodies
        if (
          callback.type !== "ArrowFunctionExpression" &&
          callback.type !== "FunctionExpression"
        ) {
          return
        }

        // Skip arrow functions with expression body (no block)
        if (callback.body.type !== "BlockStatement") return

        // Find throw statements in the callback's direct scope
        const throwStatements = findThrowStatements(callback)

        // Report each throw statement
        for (const throwStmt of throwStatements) {
          // Skip if inside nested function
          if (isInsideNestedFunction(throwStmt, callback)) continue

          // Skip if inside try-catch (the throw is being handled)
          if (isInsideTryCatch(throwStmt)) continue

          context.report({
            node: throwStmt,
            messageId: getMessageId(methodName as TargetMethod),
          })
        }
      },
    }
  },
})

export default noThrowInRefine
