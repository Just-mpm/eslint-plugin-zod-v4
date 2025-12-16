import { ruleTester } from "../setup"
import { preferSafeParse } from "../../src/rules/prefer-safeParse"

ruleTester.run("prefer-safeParse", preferSafeParse, {
  valid: [
    // Correct usage with safeParse
    "schema.safeParse(data)",
    "z.string().safeParse(input)",
    "userSchema.safeParse(formData)",

    // Async version
    "schema.safeParseAsync(data)",

    // Non-Zod parse (not matching schema naming convention)
    "JSON.parse(data)",
    "parseInt(str)",
    "Date.parse(dateStr)",
    "querystring.parse(str)",
    "data.parse(input)",
  ],
  invalid: [
    // Variable named "schema" is detected
    {
      code: "schema.parse(data)",
      errors: [{ messageId: "preferSafeParse" }],
      output: "schema.safeParse(data)",
    },
    {
      code: "z.string().parse(input)",
      errors: [{ messageId: "preferSafeParse" }],
      output: "z.string().safeParse(input)",
    },
    // Variables with "Schema" suffix are detected
    {
      code: "userSchema.parse(formData)",
      errors: [{ messageId: "preferSafeParse" }],
      output: "userSchema.safeParse(formData)",
    },
    // Inside try-catch - reports but doesn't auto-fix
    {
      code: `
        try {
          schema.parse(data)
        } catch (e) {}
      `,
      errors: [{ messageId: "preferSafeParse" }],
      output: null, // No auto-fix in try-catch
    },
  ],
})
