import { ruleTester } from "../setup"
import { noRecordSingleArg } from "../../src/rules/no-record-single-arg"

ruleTester.run("no-record-single-arg", noRecordSingleArg, {
  valid: [
    // Correct v4 usage with two arguments
    "z.record(z.string(), z.number())",
    "z.record(z.string(), z.any())",
    "z.record(z.enum(['a', 'b']), z.boolean())",

    // No arguments (edge case, but not our concern)
    "z.record()",

    // Other Zod methods
    "z.object({ key: z.string() })",
    "z.map(z.string(), z.number())",

    // Non-Zod code
    "something.record(schema)",
    "record(z.string())",
  ],
  invalid: [
    {
      code: "z.record(z.string())",
      errors: [{ messageId: "recordRequiresTwoArgs" }],
    },
    {
      code: "z.record(z.number())",
      errors: [{ messageId: "recordRequiresTwoArgs" }],
    },
    {
      code: "z.record(z.any())",
      errors: [{ messageId: "recordRequiresTwoArgs" }],
    },
    {
      code: "z.record(userSchema)",
      errors: [{ messageId: "recordRequiresTwoArgs" }],
    },
  ],
})
