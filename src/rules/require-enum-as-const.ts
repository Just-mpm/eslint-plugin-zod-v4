import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"

type MessageIds = "enumRequiresConst"

/**
 * Check if a node has `as const` assertion
 */
function hasAsConstAssertion(node: TSESTree.Node): boolean {
  return node.type === "TSAsExpression" && node.typeAnnotation?.type === "TSTypeReference"
    && (node.typeAnnotation.typeName as TSESTree.Identifier)?.name === "const"
}

/**
 * Check if the initializer of a variable has `as const`
 */
function initializerHasAsConst(initializer: TSESTree.Expression | null): boolean {
  if (!initializer) return false

  // Direct `as const` on the expression
  if (initializer.type === "TSAsExpression") {
    const typeAnnotation = initializer.typeAnnotation
    if (
      typeAnnotation.type === "TSTypeReference" &&
      typeAnnotation.typeName.type === "Identifier" &&
      typeAnnotation.typeName.name === "const"
    ) {
      return true
    }
  }

  return false
}

/**
 * Find the variable declaration for an identifier in the scope
 */
function findVariableDeclaration(
  identifierName: string,
  node: TSESTree.Node,
  context: Readonly<{ sourceCode: Readonly<{ getScope: (n: TSESTree.Node) => unknown }> }>
): TSESTree.VariableDeclarator | null {
  const scope = context.sourceCode.getScope(node) as {
    variables: Array<{ name: string; defs: Array<{ node: TSESTree.VariableDeclarator; type: string }> }>
    upper: unknown
  }

  let currentScope: {
    variables: Array<{ name: string; defs: Array<{ node: TSESTree.VariableDeclarator; type: string }> }>
    upper: unknown
  } | null = scope

  while (currentScope) {
    for (const variable of currentScope.variables) {
      if (variable.name === identifierName) {
        // Look for VariableDeclarator in defs
        for (const def of variable.defs) {
          if (def.type === "Variable" && def.node) {
            return def.node
          }
        }
      }
    }
    currentScope = (currentScope.upper && typeof currentScope.upper === 'object' && 'variables' in currentScope.upper)
      ? currentScope.upper as typeof currentScope
      : null
  }

  return null
}

/**
 * Check if the argument passed to z.enum() needs `as const`
 */
function argumentNeedsConstAssertion(
  arg: TSESTree.CallExpressionArgument,
  node: TSESTree.CallExpression,
  context: Readonly<{ sourceCode: Readonly<{ getScope: (n: TSESTree.Node) => unknown }> }>
): boolean {
  // Inline array literals don't need `as const` in Zod v4
  // Zod v4 infers types correctly from inline arrays
  if (arg.type === "ArrayExpression") {
    // Check if it already has `as const`
    if (hasAsConstAssertion(arg)) return false
    // Inline arrays without `as const` are OK in Zod v4
    return false
  }

  // If the argument is wrapped in `as const`, it's fine
  if (arg.type === "TSAsExpression") {
    if (hasAsConstAssertion(arg)) return false
  }

  // Check if it's an identifier (variable reference)
  if (arg.type === "Identifier") {
    const declaration = findVariableDeclaration(arg.name, node, context)

    if (!declaration) {
      // Variable not found - could be imported, don't report
      return false
    }

    // Check if the variable has explicit type annotation like `string[]`
    if (declaration.id.type === "Identifier") {
      // Check if there's a type annotation
      const id = declaration.id
      if ("typeAnnotation" in id && id.typeAnnotation) {
        // Has explicit type - likely `string[]`, needs `as const` won't help
        // But we should still warn
        return true
      }
    }

    // Check if the initializer has `as const`
    const init = declaration.init
    if (init) {
      if (initializerHasAsConst(init)) {
        return false
      }

      // Check if the initializer itself is an array without `as const`
      if (init.type === "ArrayExpression") {
        return true
      }

      // Check for `as const` wrapped expression
      if (init.type === "TSAsExpression") {
        return !hasAsConstAssertion(init)
      }
    }

    // Variable without initializer or not an array
    return true
  }

  // Other cases (call expressions, member expressions, etc.)
  // If it's wrapped in `as const`, check that
  if (arg.type === "TSAsExpression") {
    return !hasAsConstAssertion(arg)
  }

  return false
}

export const requireEnumAsConst = createRule<[], MessageIds>({
  name: "require-enum-as-const",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require arrays passed to z.enum() to have 'as const' for proper type inference",
    },
    schema: [],
    messages: {
      enumRequiresConst:
        "Array passed to z.enum() should have 'as const' for proper type inference.\n\n" +
        "Without 'as const', TypeScript infers 'string[]' instead of the literal union.\n\n" +
        "// ❌ Type is string[]:\n" +
        "const roles = ['admin', 'user'];\n" +
        "z.enum(roles);  // ZodEnum<string[]>\n\n" +
        "// ✅ Type is readonly ['admin', 'user']:\n" +
        "const roles = ['admin', 'user'] as const;\n" +
        "z.enum(roles);  // ZodEnum<['admin', 'user']>\n\n" +
        "// ✅ Or pass inline:\n" +
        "z.enum(['admin', 'user']);  // Works in Zod v4",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const { object, property } = node.callee

        // Check for z.enum()
        if (object.type !== "Identifier" || object.name !== "z") return
        if (property.type !== "Identifier" || property.name !== "enum") return

        // Get the first argument
        const arg = node.arguments[0]
        if (!arg) return

        // Check if this argument needs `as const`
        if (argumentNeedsConstAssertion(arg, node, context)) {
          context.report({
            node: arg,
            messageId: "enumRequiresConst",
          })
        }
      },
    }
  },
})

export default requireEnumAsConst
