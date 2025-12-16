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

    // ✅ Already using .check() (Zod v4 pattern)
    `z.object({ password: z.string() }).check((ctx) => {
      const { value: data } = ctx;
      if (data.password.length < 6) {
        ctx.addIssue({ code: 'custom', message: 'Too short' });
      }
    })`,
  ],
  invalid: [
    // Basic superRefine with two params
    {
      code: "z.string().superRefine((val, ctx) => { if (!val) ctx.addIssue({ code: 'custom' }) })",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "z.string().check((ctx) => { const { value: val } = ctx; if (!val) ctx.addIssue({ code: 'custom' }) })",
    },
    // Variable named "schema" is detected (can't auto-fix variable references)
    {
      code: "schema.superRefine(customValidator)",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      // No output field - auto-fix not possible for variable references
    },
    // Object schema with superRefine - auto-fix transforms params
    {
      code: "z.object({ password: z.string() }).superRefine((data, ctx) => {})",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "z.object({ password: z.string() }).check((ctx) => { const { value: data } = ctx;})",
    },
    // Variables with "Schema" suffix are detected
    {
      code: "userSchema.superRefine((data, ctx) => {})",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "userSchema.check((ctx) => { const { value: data } = ctx;})",
    },

    // ✅ NEW: Multi-line superRefine
    {
      code: `z.object({ name: z.string() }).superRefine((data, ctx) => {
        if (!data.name) {
          ctx.addIssue({ code: 'custom', message: 'Name required' });
        }
      })`,
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: `z.object({ name: z.string() }).check((ctx) => { const { value: data } = ctx;
        if (!data.name) {
          ctx.addIssue({ code: 'custom', message: 'Name required' });
        }
      })`,
    },

    // ✅ NEW: superRefine with only one param (data) - needs transformation
    {
      code: "z.string().superRefine((val) => { console.log(val) })",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "z.string().check((ctx) => { const { value: val } = ctx; console.log(val) })",
    },

    // ✅ NEW: superRefine with ctx as first param (already v4 style)
    {
      code: "z.string().superRefine((ctx) => { ctx.addIssue({ code: 'custom' }) })",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "z.string().check((ctx) => { ctx.addIssue({ code: 'custom' }) })",
    },

    // ✅ NEW: Expression body (can only replace method name, params preserved)
    {
      code: "z.string().superRefine((val, ctx) => val.length > 0 ? null : ctx.addIssue({ code: 'custom' }))",
      errors: [{ messageId: "deprecatedSuperRefine" }],
      output: "z.string().check((val, ctx) => val.length > 0 ? null : ctx.addIssue({ code: 'custom' }))",
    },
  ],
})
