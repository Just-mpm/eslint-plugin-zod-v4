import { ruleTester } from "../setup"
import { noDeprecatedObjectMethods } from "../../src/rules/no-deprecated-object-methods"

ruleTester.run("no-deprecated-object-methods", noDeprecatedObjectMethods, {
  valid: [
    // Correct v4 usage
    "z.strictObject({ name: z.string() })",
    "z.looseObject({ name: z.string() })",
    "z.object(existingSchema.shape)",

    // Non-Zod objects
    "config.strict()",
    "options.passthrough()",
    "data.strip()",
  ],
  invalid: [
    // .strict() deprecated
    {
      code: "z.object({ name: z.string() }).strict()",
      errors: [{ messageId: "deprecatedStrict" }],
    },
    {
      code: "schema.strict()",
      errors: [{ messageId: "deprecatedStrict" }],
    },
    // .passthrough() deprecated
    {
      code: "z.object({ name: z.string() }).passthrough()",
      errors: [{ messageId: "deprecatedPassthrough" }],
    },
    {
      code: "userSchema.passthrough()",
      errors: [{ messageId: "deprecatedPassthrough" }],
    },
    // .strip() removed
    {
      code: "z.object({ name: z.string() }).strip()",
      errors: [{ messageId: "deprecatedStrip" }],
    },
    {
      code: "schema.strip()",
      errors: [{ messageId: "deprecatedStrip" }],
    },
  ],
})
