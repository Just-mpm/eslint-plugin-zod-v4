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

    // Field names in z.object() should NOT be flagged
    // The 'message' here is a property NAME, not a deprecated parameter
    'z.object({ message: z.string() })',
    'z.object({ message: z.string().min(10, { error: "Too short" }) })',
    'z.object({ name: z.string(), message: z.string() })',

    // Complex nested case - field named 'message' with correct 'error' param
    `z.object({
      message: z
        .string()
        .min(10, { error: 'Message must be at least 10 characters' }),
    })`,

    // Another example from the bug report
    `z.object({
      message: z.string().max(2000, { error: 'Too long' }),
    })`,

    // Multiple fields including message
    `z.object({
      id: z.string(),
      message: z.string(),
      createdAt: z.date(),
    })`,

    // Nested objects with message field
    `z.object({
      user: z.object({
        message: z.string(),
      }),
    })`,

    // z.record with message field name (should not flag the key)
    'z.record(z.string(), z.object({ message: z.string() }))',
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
    // Should still detect deprecated 'message' param INSIDE z.object schema definitions
    {
      code: 'z.object({ message: z.string().min(10, { message: "Too short" }) })',
      errors: [{ messageId: "preferErrorParam" }],
      output: 'z.object({ message: z.string().min(10, { error: "Too short" }) })',
    },
    // Field named 'message' is OK, but deprecated param should be flagged
    {
      code: `z.object({
  message: z.string().min(10, { message: "Too short" }),
})`,
      errors: [{ messageId: "preferErrorParam" }],
      output: `z.object({
  message: z.string().min(10, { error: "Too short" }),
})`,
    },
  ],
})
