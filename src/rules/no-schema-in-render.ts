import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodCall, isInsideFunction } from "../utils/zod-helpers"

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
        "Avoid creating Zod schemas inside functions or React components. Schemas are recreated on every render/call, causing performance issues. Move the schema to module scope or use useMemo.",
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
          // Top-level format functions
          "email",
          "url",
          "uuid",
          "cuid",
          "cuid2",
          "ulid",
          "ip",
          "ipv4",
          "ipv6",
          "datetime",
          "base64",
        ]

        // If it's not a schema-creating method called on z, skip
        const object = node.callee.object
        if (object.type !== "Identifier" || object.name !== "z") return
        if (!schemaCreatingMethods.includes(methodName)) return

        // Check if this is inside a function
        if (!isInsideFunction(node)) return

        // Report the issue
        context.report({
          node,
          messageId: "schemaInRender",
        })
      },
    }
  },
})

export default noSchemaInRender
