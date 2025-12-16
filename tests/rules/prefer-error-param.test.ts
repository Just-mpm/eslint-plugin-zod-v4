import { ruleTester } from "../setup"
import { preferErrorParam } from "../../src/rules/prefer-error-param"

ruleTester.run("prefer-error-param", preferErrorParam, {
  valid: [
    // Correct v4 usage with 'error'
    'z.string({ error: "Name is required" })',
    'z.number({ error: (iss) => `Invalid: ${iss.code}` })',
    'z.email({ error: "Invalid email format" })',

    // No message/error params
    "z.string()",
    "z.string().min(5)",
    "z.object({ name: z.string() })",

    // Other params are fine
    "z.string({ description: 'User name' })",

    // Non-Zod code
    'console.log({ message: "hello" })',
    'fetch({ message: "test" })',
  ],
  invalid: [
    {
      code: 'z.string({ message: "Name is required" })',
      errors: [{ messageId: "preferErrorParam" }],
      output: 'z.string({ error: "Name is required" })',
    },
    {
      code: 'z.number({ message: "Must be a number" })',
      errors: [{ messageId: "preferErrorParam" }],
      output: 'z.number({ error: "Must be a number" })',
    },
    {
      code: 'z.email({ message: "Invalid email" })',
      errors: [{ messageId: "preferErrorParam" }],
      output: 'z.email({ error: "Invalid email" })',
    },
    {
      code: 'z.string().min(5, { message: "Too short" })',
      errors: [{ messageId: "preferErrorParam" }],
      output: 'z.string().min(5, { error: "Too short" })',
    },
  ],
})
