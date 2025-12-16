import { ruleTester } from "../setup"
import { noPromiseSchema } from "../../src/rules/no-promise-schema"

ruleTester.run("no-promise-schema", noPromiseSchema, {
  valid: [
    // Correct v4 usage - await before parse
    "const data = await fetchData(); schema.parse(data)",
    "schema.parseAsync(data)",

    // Regular schemas
    "z.string()",
    "z.object({ name: z.string() })",

    // Non-Zod promise
    "Promise.resolve(data)",
    "new Promise((resolve) => resolve(data))",
  ],
  invalid: [
    {
      code: "z.promise(z.string())",
      errors: [{ messageId: "deprecatedPromise" }],
    },
    {
      code: "z.promise(userSchema)",
      errors: [{ messageId: "deprecatedPromise" }],
    },
    {
      code: "z.promise(z.object({ name: z.string() }))",
      errors: [{ messageId: "deprecatedPromise" }],
    },
  ],
})
