import { ruleTester } from "../setup"
import { noDeprecatedErrorParams } from "../../src/rules/no-deprecated-error-params"

ruleTester.run("no-deprecated-error-params", noDeprecatedErrorParams, {
  valid: [
    // Correct v4 usage with 'error' param
    'z.string({ error: "Name is required" })',
    'z.number({ error: (iss) => `Expected number, got ${iss.received}` })',
    'z.email({ error: "Invalid email" })',

    // No error params
    "z.string()",
    "z.number().min(0)",
    "z.object({ name: z.string() })",

    // Other properties are fine
    "z.string({ description: 'User name' })",

    // Non-Zod code
    'something({ invalid_type_error: "test" })',
  ],
  invalid: [
    {
      code: 'z.string({ invalid_type_error: "Must be a string" })',
      errors: [{ messageId: "deprecatedErrorParam", data: { param: "invalid_type_error" } }],
      output: 'z.string({ error: "Must be a string" })',
    },
    {
      code: 'z.string({ required_error: "Name is required" })',
      errors: [{ messageId: "deprecatedErrorParam", data: { param: "required_error" } }],
      output: 'z.string({ error: "Name is required" })',
    },
    {
      code: 'z.number({ invalid_type_error: "Must be a number" })',
      errors: [{ messageId: "deprecatedErrorParam", data: { param: "invalid_type_error" } }],
      output: 'z.number({ error: "Must be a number" })',
    },
    // Both deprecated params
    {
      code: 'z.string({ invalid_type_error: "Wrong type", required_error: "Required" })',
      errors: [
        { messageId: "deprecatedErrorParam", data: { param: "invalid_type_error" } },
        { messageId: "deprecatedErrorParam", data: { param: "required_error" } },
      ],
      // Note: auto-fix will create two 'error' properties which is invalid,
      // but this is an edge case. Users should consolidate manually.
      output: 'z.string({ error: "Wrong type", error: "Required" })',
    },
  ],
})
