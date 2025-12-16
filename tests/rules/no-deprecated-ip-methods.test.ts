import { ruleTester } from "../setup"
import { noDeprecatedIpMethods } from "../../src/rules/no-deprecated-ip-methods"

ruleTester.run("no-deprecated-ip-methods", noDeprecatedIpMethods, {
  valid: [
    // Correct v4 usage - top level
    "z.ipv4()",
    "z.ipv6()",
    "z.cidrv4()",
    "z.cidrv6()",

    // Correct v4 usage - union for both IP types
    "z.union([z.ipv4(), z.ipv6()])",

    // Non-Zod ip/cidr
    "validator.ip()",
    "network.cidr()",
  ],
  invalid: [
    // .ip() on string chain removed
    {
      code: "z.string().ip()",
      errors: [{ messageId: "removedIp" }],
    },
    {
      code: "z.string().ip({ version: 'v4' })",
      errors: [{ messageId: "removedIp" }],
    },
    // .cidr() on string chain removed
    {
      code: "z.string().cidr()",
      errors: [{ messageId: "removedCidr" }],
    },
    {
      code: "z.string().cidr({ version: 'v4' })",
      errors: [{ messageId: "removedCidr" }],
    },
  ],
})
