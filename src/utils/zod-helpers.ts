import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Zod top-level format functions that replaced string methods
 */
export const ZOD_TOP_LEVEL_FORMATS = [
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
  "emoji",
  "nanoid",
  "base64",
  "base64url",
  "jwt",
  "ascii",
  "utf8",
  "hexadecimal",
  "e164",
  "bic",
  "iban",
  "date",
  "time",
  "datetime",
  "duration",
] as const

export type ZodTopLevelFormat = (typeof ZOD_TOP_LEVEL_FORMATS)[number]

/**
 * Deprecated error params that should be replaced with 'error'
 */
export const DEPRECATED_ERROR_PARAMS = [
  "invalid_type_error",
  "required_error",
] as const

/**
 * Deprecated methods on ZodError
 */
export const DEPRECATED_ZOD_ERROR_METHODS = ["format", "flatten"] as const

/**
 * Check if a node is a call to a Zod method (z.something())
 */
export function isZodCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== "MemberExpression") return false

  const object = node.callee.object

  // Direct z.method() call
  if (object.type === "Identifier" && object.name === "z") {
    return true
  }

  // Chained call like z.string().email()
  if (object.type === "CallExpression") {
    return isZodCall(object)
  }

  return false
}

/**
 * Check if a node is specifically z.string() call
 */
export function isZodStringCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== "MemberExpression") return false

  const { object, property } = node.callee

  if (object.type !== "Identifier" || object.name !== "z") return false
  if (property.type !== "Identifier" || property.name !== "string") return false

  return true
}

/**
 * Check if a node is z.record() call
 */
export function isZodRecordCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== "MemberExpression") return false

  const { object, property } = node.callee

  if (object.type !== "Identifier" || object.name !== "z") return false
  if (property.type !== "Identifier" || property.name !== "record") return false

  return true
}

/**
 * Get the method name from a member expression
 */
export function getMethodName(
  node: TSESTree.MemberExpression
): string | undefined {
  if (node.property.type === "Identifier") {
    return node.property.name
  }
  return undefined
}

/**
 * Check if the call is on a Zod schema chain
 */
export function isZodChainCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== "MemberExpression") return false

  let current: TSESTree.Node = node.callee.object

  while (current.type === "CallExpression") {
    if (isZodCall(current)) return true
    if (current.callee.type !== "MemberExpression") break
    current = current.callee.object
  }

  if (current.type === "Identifier" && current.name === "z") {
    return true
  }

  return false
}

/**
 * Find the root z.* call in a chain
 */
export function findRootZodCall(
  node: TSESTree.CallExpression
): TSESTree.CallExpression | undefined {
  let current: TSESTree.Node = node

  while (current.type === "CallExpression") {
    if (current.callee.type !== "MemberExpression") return undefined

    const object = current.callee.object

    if (object.type === "Identifier" && object.name === "z") {
      return current
    }

    if (object.type === "CallExpression") {
      current = object
    } else {
      break
    }
  }

  return undefined
}

/**
 * Check if a property exists in an object expression
 */
export function hasProperty(
  node: TSESTree.ObjectExpression,
  propertyName: string
): boolean {
  return node.properties.some(
    (prop) =>
      prop.type === "Property" &&
      prop.key.type === "Identifier" &&
      prop.key.name === propertyName
  )
}

/**
 * Get the Zod method being called (e.g., 'string', 'number', 'object')
 */
export function getZodMethodName(
  node: TSESTree.CallExpression
): string | undefined {
  if (node.callee.type !== "MemberExpression") return undefined

  const { object, property } = node.callee

  if (object.type === "Identifier" && object.name === "z") {
    if (property.type === "Identifier") {
      return property.name
    }
  }

  return undefined
}

/**
 * Check if a function/arrow function is a React component (heuristic)
 */
export function isReactComponent(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): boolean {
  // Check function name starts with uppercase (convention for components)
  if (node.type === "FunctionDeclaration" && node.id) {
    const name = node.id.name
    return /^[A-Z]/.test(name)
  }

  // For variable declarations like `const MyComponent = () => {}`
  if (
    node.parent?.type === "VariableDeclarator" &&
    node.parent.id.type === "Identifier"
  ) {
    const name = node.parent.id.name
    return /^[A-Z]/.test(name)
  }

  return false
}

/**
 * Check if node is inside a function body (not at module level)
 */
export function isInsideFunction(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent

  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return true
    }
    current = current.parent
  }

  return false
}

/**
 * Check if a call is likely on a Zod schema variable
 * Uses heuristics: variable name patterns and method-specific checks
 */
export function isLikelyZodSchemaCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== "MemberExpression") return false

  // If it's a direct z.* chain, it's definitely Zod
  if (isZodChainCall(node)) return true

  // Check if calling on an identifier that looks like a schema
  const object = node.callee.object
  if (object.type === "Identifier") {
    const name = object.name.toLowerCase()
    // Common schema naming patterns
    if (
      name.endsWith("schema") ||
      name === "schema" ||
      name === "validator" ||
      name === "zodschema"
    ) {
      return true
    }
  }

  return false
}

/**
 * React hooks that memoize their callbacks
 */
const REACT_MEMO_HOOKS = ["useMemo", "useCallback"] as const

/**
 * Check if a node is inside a memoized callback (useMemo/useCallback)
 * This is used to allow schema creation inside memoized callbacks
 */
export function isInsideMemoizedCallback(node: TSESTree.Node): boolean {
  // We're looking for the pattern: useMemo(() => ..., [deps])
  // where node is inside the arrow function

  // Check if parent is a CallExpression with useMemo/useCallback
  if (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression") {
    return false
  }

  const parent = node.parent
  if (!parent || parent.type !== "CallExpression") {
    return false
  }

  // Check if this function is the first argument of useMemo/useCallback
  if (parent.arguments[0] !== node) {
    return false
  }

  // Check if the callee is useMemo or useCallback
  const callee = parent.callee

  // Direct call: useMemo(...)
  if (callee.type === "Identifier") {
    return REACT_MEMO_HOOKS.includes(callee.name as typeof REACT_MEMO_HOOKS[number])
  }

  // Namespaced call: React.useMemo(...)
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return REACT_MEMO_HOOKS.includes(callee.property.name as typeof REACT_MEMO_HOOKS[number])
  }

  return false
}
