import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodChainCall, getMethodName } from "../utils/zod-helpers"

type MessageIds = "removedIp" | "removedCidr"

export const noDeprecatedIpMethods = createRule<[], MessageIds>({
  name: "no-deprecated-ip-methods",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow removed .ip() and .cidr() methods in favor of specific ipv4/ipv6 variants",
    },
    schema: [],
    messages: {
      removedIp:
        ".ip() was removed in Zod v4. Use .ipv4() or .ipv6() instead. For both, use z.union([z.ipv4(), z.ipv6()]).",
      removedCidr:
        ".cidr() was removed in Zod v4. Use .cidrv4() or .cidrv6() instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "MemberExpression") return

        const methodName = getMethodName(node.callee)

        // Check for .ip() on z.string() chain
        if (methodName === "ip") {
          if (!isZodChainCall(node)) return

          // Make sure it's on a string chain, not z.ip() top-level
          const object = node.callee.object
          if (object.type === "Identifier" && object.name === "z") {
            // This is z.ip() which is valid in v4
            return
          }

          context.report({
            node,
            messageId: "removedIp",
          })
          return
        }

        // Check for .cidr() on z.string() chain
        if (methodName === "cidr") {
          if (!isZodChainCall(node)) return

          context.report({
            node,
            messageId: "removedCidr",
          })
        }
      },
    }
  },
})

export default noDeprecatedIpMethods
