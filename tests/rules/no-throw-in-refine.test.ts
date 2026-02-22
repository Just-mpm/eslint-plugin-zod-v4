import { ruleTester } from "../setup"
import { noThrowInRefine } from "../../src/rules/no-throw-in-refine"

ruleTester.run("no-throw-in-refine", noThrowInRefine, {
  valid: [
    // .refine() - Retorno simples (arrow function com corpo de expressão)
    "z.string().refine((val) => val.length > 0)",
    "z.string().refine((val) => val.length > 0 || 'Too short')",
    "z.string().refine((val) => Boolean(val))",

    // .refine() - Com try/catch (throw está tratado)
    "z.string().refine((val) => { try { validate(val); return true; } catch { return false; } })",
    "z.string().refine((val) => { try { if (!val) throw new Error(); return true; } catch { return false; } })",

    // .refine() - Função aninhada com throw (não afeta o callback)
    "z.string().refine((val) => { const helper = () => { throw new Error(); }; return true; })",
    "z.string().refine((val) => { function nested() { throw new Error(); } return true; })",

    // .refine() - Sem throw
    "z.string().refine((val) => { if (!val) return false; return true; })",
    "z.string().refine((val) => { return val.length > 0; })",

    // .refine() - Function expression sem throw
    "z.string().refine(function(val) { return val.length > 0; })",

    // .transform() - Sem throw
    "z.string().transform((val) => val.toUpperCase())",
    "z.string().transform((val) => { return val.toUpperCase(); })",

    // .transform() - Com ctx.issues.push (padrão correto)
    "z.string().transform((val, ctx) => { if (!val) { ctx.issues.push({ code: 'custom' }); return z.NEVER; } return val; })",

    // .transform() - Com try/catch
    "z.string().transform((val) => { try { return process(val); } catch { return val; } })",

    // .transform() - Função aninhada com throw (não afeta o callback)
    "z.string().transform((val) => { const helper = () => { throw new Error(); }; return val; })",

    // .superRefine() - Sem throw, usando ctx.addIssue
    "z.string().superRefine((val, ctx) => { if (!val) ctx.addIssue({ code: 'custom' }); })",
    "z.string().superRefine((val, ctx) => { if (!val) { ctx.addIssue({ code: 'custom', message: 'Required' }); } })",

    // .superRefine() - Com try/catch
    "z.string().superRefine((val, ctx) => { try { validate(val); } catch { ctx.addIssue({ code: 'custom' }); } })",

    // .superRefine() - Função aninhada com throw
    "z.string().superRefine((val, ctx) => { const helper = () => { throw new Error(); }; ctx.addIssue({ code: 'custom' }); })",

    // Chamada em variável (schema)
    "schema.refine((val) => val.length > 0)",
    "userSchema.transform((val) => val.name)",
  ],

  invalid: [
    // .refine() com throw
    {
      code: "z.string().refine((val) => { if (!val) throw new Error('Empty'); return true; })",
      errors: [{ messageId: "throwInRefine" }],
    },
    {
      code: "z.string().refine((val) => { throw new Error('Always fails'); })",
      errors: [{ messageId: "throwInRefine" }],
    },
    {
      code: "schema.refine(function(x) { if (invalid) throw new Error(); return true; })",
      errors: [{ messageId: "throwInRefine" }],
    },
    {
      code: "z.string().refine((val) => { if (val === 'test') throw new Error(); return true; })",
      errors: [{ messageId: "throwInRefine" }],
    },
    {
      code: "z.object({ name: z.string() }).refine((data) => { if (!data.name) throw new Error(); return true; })",
      errors: [{ messageId: "throwInRefine" }],
    },

    // .transform() com throw
    {
      code: "z.string().transform((val) => { if (!val) throw new Error('Empty'); return val; })",
      errors: [{ messageId: "throwInTransform" }],
    },
    {
      code: "z.string().transform((val) => { throw new Error('Always fails'); })",
      errors: [{ messageId: "throwInTransform" }],
    },
    {
      code: "z.number().transform((val) => { if (val < 0) throw new Error('Negative'); return val; })",
      errors: [{ messageId: "throwInTransform" }],
    },
    {
      code: "schema.transform(function(x) { throw new Error(); })",
      errors: [{ messageId: "throwInTransform" }],
    },

    // .superRefine() com throw
    {
      code: "z.string().superRefine((val, ctx) => { if (!val) throw new Error('Empty'); })",
      errors: [{ messageId: "throwInSuperRefine" }],
    },
    {
      code: "z.string().superRefine((val, ctx) => { throw new Error('Always fails'); })",
      errors: [{ messageId: "throwInSuperRefine" }],
    },
    {
      code: "z.object({ email: z.string() }).superRefine((data, ctx) => { if (!data.email) throw new Error(); })",
      errors: [{ messageId: "throwInSuperRefine" }],
    },
    {
      code: "schema.superRefine(function(val, ctx) { if (invalid) throw new Error(); })",
      errors: [{ messageId: "throwInSuperRefine" }],
    },

    // Múltiplos throws no mesmo callback
    {
      code: "z.string().refine((val) => { if (!val) throw new Error('Empty'); if (val.length > 100) throw new Error('Too long'); return true; })",
      errors: [{ messageId: "throwInRefine" }, { messageId: "throwInRefine" }],
    },

    // Throw em catch block (não está no try, então deve reportar)
    {
      code: "z.string().refine((val) => { try { validate(val); } catch { throw new Error('Re-throw'); } return true; })",
      errors: [{ messageId: "throwInRefine" }],
    },
  ],
})
