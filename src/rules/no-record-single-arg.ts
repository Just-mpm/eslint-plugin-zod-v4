import type { TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../utils/create-rule"
import { isZodRecordCall } from "../utils/zod-helpers"

type MessageIds = "recordRequiresTwoArgs"

export const noRecordSingleArg = createRule<[], MessageIds>({
  name: "no-record-single-arg",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require z.record() to have two arguments (key schema and value schema) as required in Zod v4",
    },
    schema: [],
    messages: {
      recordRequiresTwoArgs:
        "z.record() requires two arguments in Zod v4: z.record(keySchema, valueSchema). The first argument is the key schema (usually z.string()) and the second is the value schema.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isZodRecordCall(node)) return

        // z.record() in v4 requires exactly 2 arguments
        if (node.arguments.length === 1) {
          context.report({
            node,
            messageId: "recordRequiresTwoArgs",
          })
        }
      },
    }
  },
})

export default noRecordSingleArg
