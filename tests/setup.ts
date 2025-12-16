import { RuleTester } from "@typescript-eslint/rule-tester"
import * as vitest from "vitest"

// Configure RuleTester to use vitest
RuleTester.afterAll = vitest.afterAll
RuleTester.it = vitest.it
RuleTester.itOnly = vitest.it.only
RuleTester.describe = vitest.describe

export const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
})
