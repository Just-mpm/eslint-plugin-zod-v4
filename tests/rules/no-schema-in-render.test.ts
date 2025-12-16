import { ruleTester } from "../setup"
import { noSchemaInRender } from "../../src/rules/no-schema-in-render"

ruleTester.run("no-schema-in-render", noSchemaInRender, {
  valid: [
    // Module-level schemas (correct)
    "const schema = z.object({ name: z.string() })",
    "const emailSchema = z.email()",
    "export const userSchema = z.object({ id: z.number() })",

    // Using schemas inside functions (not creating)
    `
      const schema = z.string()
      function validate(data) {
        return schema.parse(data)
      }
    `,
    `
      const schema = z.object({ name: z.string() })
      const MyComponent = () => {
        const result = schema.safeParse(data)
        return null
      }
    `,

    // Non-Zod code inside functions
    `
      function test() {
        const obj = { name: 'test' }
        return obj
      }
    `,
  ],
  invalid: [
    // Schema created inside regular function - z.object creates z.object + nested z.string = 2 errors
    {
      code: `
        function validate(data) {
          const schema = z.object({ name: z.string() })
          return schema.parse(data)
        }
      `,
      errors: [
        { messageId: "schemaInRender" },
        { messageId: "schemaInRender" },
      ],
    },
    // Simple schema created inside arrow function
    {
      code: `
        const validate = (data) => {
          const schema = z.string()
          return schema.safeParse(data)
        }
      `,
      errors: [{ messageId: "schemaInRender" }],
    },
    // Schema created inside React component - z.object + z.string = 2 errors
    {
      code: `
        function MyComponent() {
          const schema = z.object({ name: z.string() })
          return null
        }
      `,
      errors: [
        { messageId: "schemaInRender" },
        { messageId: "schemaInRender" },
      ],
    },
    // Simple schema created inside arrow function component
    {
      code: `
        const MyComponent = () => {
          const schema = z.email()
          return null
        }
      `,
      errors: [{ messageId: "schemaInRender" }],
    },
    // Multiple schemas inside function
    {
      code: `
        function process() {
          const nameSchema = z.string()
          const ageSchema = z.number()
          return null
        }
      `,
      errors: [
        { messageId: "schemaInRender" },
        { messageId: "schemaInRender" },
      ],
    },
  ],
})
