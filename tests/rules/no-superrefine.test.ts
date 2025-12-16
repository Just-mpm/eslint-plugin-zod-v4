import { ruleTester } from "../setup"
import { noSuperRefine } from "../../src/rules/no-superrefine"

ruleTester.run("no-superrefine", noSuperRefine, {
  valid: [
    // Correct v4 usage with check
    "schema.check((val) => val.length > 0)",
    "z.string().check((val) => val.includes('@'))",

    // Regular refine is still valid
    "z.string().refine((val) => val.length > 0)",
    "schema.refine((val) => isValid(val), { message: 'Invalid' })",

    // Other methods
    "schema.transform((val) => val.trim())",
    "schema.pipe(z.string())",

    // Non-Zod superRefine (not matching schema naming convention)
    "something.superRefine()",
    "data.superRefine(fn)",
  ],
  invalid: [
    {
      code: "z.string().superRefine((val, ctx) => { if (!val) ctx.addIssue({ code: 'custom' }) })",
      errors: [{ messageId: "deprecatedSuperRefine" }],
    },
    // Variable named "schema" is detected
    {
      code: "schema.superRefine(customValidator)",
      errors: [{ messageId: "deprecatedSuperRefine" }],
    },
    {
      code: "z.object({ password: z.string() }).superRefine((data, ctx) => {})",
      errors: [{ messageId: "deprecatedSuperRefine" }],
    },
    // Variables with "Schema" suffix are detected
    {
      code: "userSchema.superRefine((data, ctx) => {})",
      errors: [{ messageId: "deprecatedSuperRefine" }],
    },
  ],
})
