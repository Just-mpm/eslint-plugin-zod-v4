import { ruleTester } from "../setup"
import { noDeprecatedFormatMethods } from "../../src/rules/no-deprecated-format-methods"

ruleTester.run("no-deprecated-format-methods", noDeprecatedFormatMethods, {
  valid: [
    // Correct v4 usage with z.treeifyError
    "z.treeifyError(error)",
    "z.treeifyError(result.error)",

    // Non-ZodError objects
    "data.format()",
    "string.format()",
    "response.flatten()",

    // Different contexts
    "date.format('YYYY-MM-DD')",
    "array.flatten()",
  ],
  invalid: [
    // Direct error.format()
    {
      code: "error.format()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "format" } }],
    },
    {
      code: "error.flatten()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "flatten" } }],
    },
    // result.error.format()
    {
      code: "result.error.format()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "format" } }],
    },
    {
      code: "result.error.flatten()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "flatten" } }],
    },
    // Catch block pattern
    {
      code: "e.format()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "format" } }],
    },
    {
      code: "err.flatten()",
      errors: [{ messageId: "deprecatedFormatMethod", data: { method: "flatten" } }],
    },
  ],
})
