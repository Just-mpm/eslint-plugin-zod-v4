import { ruleTester } from "../setup"
import { noDeepPartial } from "../../src/rules/no-deep-partial"

ruleTester.run("no-deep-partial", noDeepPartial, {
  valid: [
    // Correct v4 usage - shallow partial
    "schema.partial()",
    "z.object({ name: z.string() }).partial()",
    "userSchema.partial()",

    // Non-Zod deepPartial
    "lodash.deepPartial(obj)",
    "utils.deepPartial(data)",
  ],
  invalid: [
    {
      code: "z.object({ name: z.string() }).deepPartial()",
      errors: [{ messageId: "removedDeepPartial" }],
    },
    {
      code: "schema.deepPartial()",
      errors: [{ messageId: "removedDeepPartial" }],
    },
    {
      code: "userSchema.deepPartial()",
      errors: [{ messageId: "removedDeepPartial" }],
    },
  ],
})
