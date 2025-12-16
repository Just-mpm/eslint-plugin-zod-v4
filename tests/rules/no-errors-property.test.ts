import { ruleTester } from "../setup"
import { noErrorsProperty } from "../../src/rules/no-errors-property"

ruleTester.run("no-errors-property", noErrorsProperty, {
  valid: [
    // Correct v4 usage with .issues
    "error.issues",
    "result.error.issues",
    "e.issues",
    "zodError.issues",

    // Non-ZodError objects (different names)
    "response.errors",
    "data.errors",
    "form.errors",
    "validation.errors",
    "apiResponse.errors",

    // Other properties on error-like objects
    "error.message",
    "error.code",
    "result.error.message",
  ],
  invalid: [
    // Direct error.errors
    {
      code: "error.errors",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "error.issues",
    },
    // result.error.errors pattern
    {
      code: "result.error.errors",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "result.error.issues",
    },
    // Catch block pattern
    {
      code: "e.errors",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "e.issues",
    },
    {
      code: "err.errors",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "err.issues",
    },
    // Explicit ZodError variable
    {
      code: "zodError.errors",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "zodError.issues",
    },
    // Iteration over errors
    {
      code: "error.errors.forEach(e => console.log(e))",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "error.issues.forEach(e => console.log(e))",
    },
    // Accessing length
    {
      code: "result.error.errors.length",
      errors: [{ messageId: "deprecatedErrorsProperty" }],
      output: "result.error.issues.length",
    },
  ],
})
