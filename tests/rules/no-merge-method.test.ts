import { ruleTester } from "../setup"
import { noMergeMethod } from "../../src/rules/no-merge-method"

ruleTester.run("no-merge-method", noMergeMethod, {
  valid: [
    // Correct v4 usage with extend
    "baseSchema.extend(additionalSchema.shape)",
    "z.object({ name: z.string() }).extend({ age: z.number() })",

    // Spread operator approach
    "z.object({ ...schema1.shape, ...schema2.shape })",

    // Other methods on schema variables
    "schema.pick({ name: true })",
    "schema.omit({ id: true })",
    "schema.partial()",

    // Non-Zod merge (not matching schema naming convention)
    "Object.merge(a, b)",
    "lodash.merge(obj1, obj2)",
    "_.merge(obj1, obj2)",
    "data.merge(other)",
  ],
  invalid: [
    {
      code: "z.object({ name: z.string() }).merge(z.object({ age: z.number() }))",
      errors: [{ messageId: "deprecatedMerge" }],
    },
    // Variables with "Schema" suffix are detected
    {
      code: "userSchema.merge(timestampSchema)",
      errors: [{ messageId: "deprecatedMerge" }],
    },
    {
      code: "baseSchema.merge(additionalFields)",
      errors: [{ messageId: "deprecatedMerge" }],
    },
    // Variable named "schema" is detected
    {
      code: "schema.merge(otherSchema)",
      errors: [{ messageId: "deprecatedMerge" }],
    },
  ],
})
