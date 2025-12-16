import { ruleTester } from "../setup"
import { noDeprecatedStringFormat } from "../../src/rules/no-deprecated-string-format"

ruleTester.run("no-deprecated-string-format", noDeprecatedStringFormat, {
  valid: [
    // Top-level format functions (correct v4 usage)
    "z.email()",
    'z.email({ error: "Invalid email" })',
    "z.url()",
    "z.uuid()",
    "z.ip()",
    "z.datetime()",

    // Non-format methods on z.string() are fine
    "z.string()",
    "z.string().min(5)",
    "z.string().max(100)",
    "z.string().length(10)",
    "z.string().trim()",
    "z.string().toLowerCase()",

    // Other Zod types
    "z.number().int()",
    "z.object({ name: z.string() })",
    "z.array(z.string())",

    // Non-Zod code
    'something.email()',
    'validator.email()',
  ],
  invalid: [
    {
      code: "z.string().email()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "email" } }],
      output: "z.email()",
    },
    {
      code: 'z.string().email({ message: "Invalid email" })',
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "email" } }],
      output: 'z.email({ message: "Invalid email" })',
    },
    {
      code: "z.string().url()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "url" } }],
      output: "z.url()",
    },
    {
      code: "z.string().uuid()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "uuid" } }],
      output: "z.uuid()",
    },
    {
      code: "z.string().ip()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "ip" } }],
      output: "z.ip()",
    },
    {
      code: "z.string().datetime()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "datetime" } }],
      output: "z.datetime()",
    },
    {
      code: "z.string().base64()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "base64" } }],
      output: "z.base64()",
    },
    // With constraints - should report but not auto-fix
    {
      code: "z.string().min(5).email()",
      errors: [{ messageId: "deprecatedStringFormat", data: { method: "email" } }],
      output: null, // No auto-fix because of constraints
    },
  ],
})
