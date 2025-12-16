import { ruleTester } from "../setup"
import { noNativeEnum } from "../../src/rules/no-native-enum"

ruleTester.run("no-native-enum", noNativeEnum, {
  valid: [
    // Correct v4 usage
    "z.enum(['A', 'B', 'C'])",
    "z.enum(MyEnum)",

    // Non-Zod nativeEnum
    "other.nativeEnum(MyEnum)",
    "validator.nativeEnum()",
  ],
  invalid: [
    {
      code: "z.nativeEnum(MyEnum)",
      errors: [{ messageId: "deprecatedNativeEnum" }],
    },
    {
      code: "z.nativeEnum(Status)",
      errors: [{ messageId: "deprecatedNativeEnum" }],
    },
    {
      code: "z.nativeEnum(UserRole)",
      errors: [{ messageId: "deprecatedNativeEnum" }],
    },
  ],
})
