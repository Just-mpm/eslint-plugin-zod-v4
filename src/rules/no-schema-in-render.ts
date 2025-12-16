import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodCall, isInsideMemoizedCallback } from "../utils/zod-helpers"

type MessageIds = "schemaInRender"

export const noSchemaInRender = createRule<[], MessageIds>({
  name: "no-schema-in-render",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow creating Zod schemas inside functions/components to avoid performance issues",
    },
    schema: [],
    messages: {
      schemaInRender:
        "Avoid creating Zod schemas inside functions or React components. " +
        "Schemas are recreated on every render/call, causing performance issues. " +
        "Move the schema to module scope, use useMemo(() => z.object({...}), [deps]), " +
        "or extract to a factory function called with useMemo.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Check if this is a z.* call that creates a schema
        if (!isZodCall(node)) return

        // Skip if it's a method call on an existing schema (like .parse())
        if (node.callee.type !== "MemberExpression") return

        const property = node.callee.property
        if (property.type !== "Identifier") return

        const methodName = property.name

        // Schema-creating methods called on z.*
        const schemaCreatingMethods = [
          "object",
          "string",
          "number",
          "boolean",
          "array",
          "tuple",
          "union",
          "discriminatedUnion",
          "intersection",
          "record",
          "map",
          "set",
          "function",
          "lazy",
          "literal",
          "enum",
          "nativeEnum",
          "promise",
          "any",
          "unknown",
          "never",
          "void",
          "null",
          "undefined",
          "bigint",
          "date",
          "symbol",
          "nan",
          "instanceof",
          "custom",
          "preprocess",
          "coerce",
          // Top-level format functions (Zod v4)
          "email",
          "url",
          "uuid",
          "cuid",
          "cuid2",
          "ulid",
          "ip",
          "ipv4",
          "ipv6",
          "cidr",
          "cidrv4",
          "cidrv6",
          "datetime",
          "base64",
          "base64url",
          "jwt",
          "emoji",
          "nanoid",
          "ascii",
          "utf8",
          "hexadecimal",
          "e164",
          "bic",
          "iban",
          "time",
          "duration",
        ]

        // If it's not a schema-creating method called on z, skip
        const object = node.callee.object
        if (object.type !== "Identifier" || object.name !== "z") return
        if (!schemaCreatingMethods.includes(methodName)) return

        // Check if this is inside a function
        if (!isInsideFunctionButNotMemoized(node)) return

        // Report the issue
        context.report({
          node,
          messageId: "schemaInRender",
        })
      },
    }
  },
})

/**
 * Check if node is inside a function body but NOT safely memoized.
 *
 * Safe patterns (returns false):
 * - useMemo(() => z.object({...}), []) - directly in memoized callback
 * - Module-level arrow expression factory: const createSchema = () => z.object({...})
 *
 * Unsafe patterns (returns true):
 * - Schema inside a component/function without memoization
 * - Schema inside a nested function within useMemo
 * - Schema inside block body functions (even at module level)
 */
function isInsideFunctionButNotMemoized(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent
  const functionStack: TSESTree.Node[] = []

  // Collect all function ancestors
  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      functionStack.push(current)
    }
    current = current.parent
  }

  // If no function ancestors, it's at module level - safe
  if (functionStack.length === 0) {
    return false
  }

  // Get the innermost function (immediate parent function)
  // Safe to use ! because we checked length > 0 above
  const innermostFunction = functionStack[0]!

  // Check if directly inside a memoized callback (useMemo/useCallback)
  if (isInsideMemoizedCallback(innermostFunction)) {
    return false // Directly in useMemo callback - safe
  }

  // Check if there's a memoized callback higher in the stack
  // (schema is in a nested function inside useMemo - NOT safe)
  for (let i = 1; i < functionStack.length; i++) {
    const func = functionStack[i]
    if (func && isInsideMemoizedCallback(func)) {
      return true // Nested function inside useMemo - not safe
    }
  }

  // Special case: arrow function with expression body at module level (factory pattern)
  // Example: const createSchema = (t) => z.object({ email: z.email(t('error')) })
  const outermostFunction = functionStack[functionStack.length - 1]!
  if (isModuleLevelFactoryFunction(outermostFunction)) {
    return false // Factory function pattern - safe
  }

  // Inside a function but not memoized
  return true
}

/**
 * Check if a function is a factory function at module level.
 *
 * Only allows arrow functions with expression body (implicit return of schema).
 * Block body functions are NOT allowed because they may use schemas internally
 * rather than returning them.
 *
 * Valid: const createSchema = (t) => z.object({...})
 * Invalid: const createSchema = (t) => { return z.object({...}) }
 * Invalid: function createSchema(t) { return z.object({...}) }
 */
function isModuleLevelFactoryFunction(node: TSESTree.Node): boolean {
  // Only arrow functions with expression body (not block body)
  if (node.type !== "ArrowFunctionExpression") {
    return false
  }

  const arrowFunc = node as TSESTree.ArrowFunctionExpression
  if (arrowFunc.body.type === "BlockStatement") {
    return false // Block body - could use schema internally
  }

  // Check if at module level
  const parent = node.parent
  if (parent?.type === "VariableDeclarator") {
    const varDecl = parent.parent
    if (varDecl?.type === "VariableDeclaration") {
      const grandParent = varDecl.parent
      return grandParent?.type === "Program" || grandParent?.type === "ExportNamedDeclaration"
    }
  }

  return false
}

export default noSchemaInRender
