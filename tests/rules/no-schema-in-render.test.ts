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

    // ✅ NEW: useMemo with schema creation (should be valid)
    `
      const MyComponent = () => {
        const schema = useMemo(() => z.object({ name: z.string() }), [])
        return null
      }
    `,
    `
      const MyComponent = () => {
        const schema = useMemo(() => z.email(), [])
        return null
      }
    `,
    `
      function MyComponent() {
        const schema = useMemo(() => z.string().min(1), [])
        return schema.parse(value)
      }
    `,

    // ✅ NEW: React.useMemo (namespaced)
    `
      const MyComponent = () => {
        const schema = React.useMemo(() => z.object({ id: z.number() }), [])
        return null
      }
    `,

    // ✅ NEW: useCallback with schema creation (edge case but valid)
    `
      const MyComponent = () => {
        const createSchema = useCallback(() => z.object({ name: z.string() }), [])
        return null
      }
    `,

    // ✅ NEW: useMemo with dependencies
    `
      const MyComponent = ({ t }) => {
        const schema = useMemo(() => z.object({
          email: z.email(t('invalidEmail')),
        }), [t])
        return null
      }
    `,

    // ✅ NEW: Factory function called inside useMemo
    `
      const createSchema = (t) => z.object({ email: z.email(t('error')) })
      const MyComponent = ({ t }) => {
        const schema = useMemo(() => createSchema(t), [t])
        return null
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

    // ❌ NEW: Schema NOT inside useMemo (still invalid)
    {
      code: `
        const MyComponent = () => {
          const schema = z.email()
          const memoizedValue = useMemo(() => computeValue(), [])
          return null
        }
      `,
      errors: [{ messageId: "schemaInRender" }],
    },

    // ❌ NEW: Schema inside a nested function, not useMemo callback
    {
      code: `
        const MyComponent = () => {
          const memoized = useMemo(() => {
            return function inner() {
              return z.string()
            }
          }, [])
          return null
        }
      `,
      errors: [{ messageId: "schemaInRender" }],
    },
  ],
})
