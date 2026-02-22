import { ruleTester } from "../setup"
import { requireEnumAsConst } from "../../src/rules/require-enum-as-const"

ruleTester.run("require-enum-as-const", requireEnumAsConst, {
  valid: [
    // Inline array (Zod v4 aceita e infere corretamente)
    "z.enum(['admin', 'user'])",
    "z.enum(['admin', 'user', 'guest'])",
    "z.enum(['a', 'b', 'c', 'd'])",
    "z.enum(['single'])",

    // Variável com as const
    "const roles = ['admin', 'user'] as const; z.enum(roles)",
    "const roles = ['admin', 'user'] as const; const schema = z.enum(roles)",
    "const roles = ['admin', 'user'] as const; z.enum(roles); z.enum(roles)",

    // Spread de arrays com as const
    "const adminRoles = ['admin'] as const; const userRoles = ['user'] as const; z.enum([...adminRoles, ...userRoles] as const)",

    // Importado de outro módulo (não temos controle)
    "import { roles } from './constants'; z.enum(roles)",

    // Usando z.enum com variável desconhecida (não encontramos a declaração)
    "z.enum(unknownVar)",

    // Usando schema ao invés de z
    "import { z as schema } from 'zod'; schema.enum(['a', 'b'])",

    // Array inline com as const (redundante mas válido)
    "z.enum(['a', 'b'] as const)",

    // Variável com as const no uso direto
    "const roles = ['admin', 'user']; z.enum(roles as const)",
  ],

  invalid: [
    // Variável sem as const
    {
      code: "const roles = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Variável com tipo string[]
    {
      code: "const roles: string[] = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // let sem as const
    {
      code: "let roles = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // var sem as const
    {
      code: "var roles = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Variável usada em múltiplos lugares
    {
      code: "const roles = ['admin', 'user']; z.enum(roles); z.enum(roles)",
      errors: [
        { messageId: "enumRequiresConst" },
        { messageId: "enumRequiresConst" },
      ],
    },

    // Variável declarada em escopo superior
    {
      code: "const roles = ['admin', 'user']; function makeSchema() { return z.enum(roles); }",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Array com apenas um elemento
    {
      code: "const status = ['active']; z.enum(status)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Array vazio
    {
      code: "const empty: string[] = []; z.enum(empty)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Usando em schema aninhado
    {
      code: "const roles = ['admin']; z.object({ role: z.enum(roles) })",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Variável em arrow function
    {
      code: "const roles = ['admin', 'user']; const getSchema = () => z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Variável sem inicializador
    {
      code: "let roles: string[]; roles = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },

    // Com tipo explícito não-readonly
    {
      code: "const roles: ['admin', 'user'] = ['admin', 'user']; z.enum(roles)",
      errors: [{ messageId: "enumRequiresConst" }],
    },
  ],
})
