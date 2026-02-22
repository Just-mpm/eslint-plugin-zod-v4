# eslint-plugin-zod-v4

ESLint plugin for Zod v4 best practices and migration from v3.

[![npm version](https://badge.fury.io/js/eslint-plugin-zod-v4.svg)](https://www.npmjs.com/package/eslint-plugin-zod-v4)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Detects deprecated Zod v3 patterns that break in v4
- Enforces Zod v4 best practices
- Auto-fix support for most rules
- Educational error messages explaining the correct approach
- Full ESLint 9+ flat config support
- **React-aware**: Recognizes `useMemo`/`useCallback` for schema memoization

## Installation

```bash
npm install --save-dev eslint-plugin-zod-v4
```

## Requirements

- ESLint >= 9.0.0
- Node.js >= 18.18.0

## Usage

### ESLint 9+ (Flat Config)

```javascript
// eslint.config.js
import zodPlugin from "eslint-plugin-zod-v4"

export default [
  // Use recommended config (breaking changes only)
  zodPlugin.configs.recommended,

  // Or use strict config (recommended + best practices)
  // zodPlugin.configs.strict,

  // Or configure rules manually
  {
    plugins: {
      "zod-v4": zodPlugin,
    },
    rules: {
      "zod-v4/no-deprecated-string-format": "error",
      "zod-v4/prefer-safeParse": "warn",
    },
  },
]
```

## Configs

| Config | Description |
|--------|-------------|
| `recommended` | Breaking changes only (errors). Use to catch code that will break in Zod v4. |
| `strict` | Recommended + best practices (warnings). Enforces optimal Zod v4 patterns. |
| `all` | All rules enabled as errors. Maximum strictness. |

## Rules

### Breaking Changes (severity: error)

These rules detect Zod v3 patterns that will break in v4.

| Rule | Description | Fixable |
|------|-------------|---------|
| [no-deprecated-string-format](docs/rules/no-deprecated-string-format.md) | Disallow `z.string().email()` etc. Use `z.email()` instead. | ✅ Yes |
| [no-record-single-arg](docs/rules/no-record-single-arg.md) | Require `z.record(keySchema, valueSchema)` with two arguments. | ❌ No |
| [no-deprecated-error-params](docs/rules/no-deprecated-error-params.md) | Disallow `invalid_type_error`/`required_error`. Use `error` param. | ✅ Yes |
| [no-deprecated-format-methods](docs/rules/no-deprecated-format-methods.md) | Disallow `.format()`/`.flatten()` on ZodError. Use `z.treeifyError()`. | ❌ No |
| [no-merge-method](docs/rules/no-merge-method.md) | Disallow `.merge()`. Use `.extend()` instead. | ❌ No |
| [no-superrefine](docs/rules/no-superrefine.md) | Disallow `.superRefine()`. Use `.check()` instead. | ✅ Yes |
| [no-errors-property](docs/rules/no-errors-property.md) | Disallow `error.errors`. Use `error.issues` instead. | ✅ Yes |
| [no-deprecated-object-methods](docs/rules/no-deprecated-object-methods.md) | Disallow `.strict()`/`.passthrough()`/`.strip()`. Use top-level functions. | ❌ No |
| [no-native-enum](docs/rules/no-native-enum.md) | Disallow `z.nativeEnum()`. Use `z.enum()` instead. | ❌ No |
| [no-deep-partial](docs/rules/no-deep-partial.md) | Disallow `.deepPartial()` (removed in v4). | ❌ No |
| [no-deprecated-ip-methods](docs/rules/no-deprecated-ip-methods.md) | Disallow `.ip()`/`.cidr()`. Use `.ipv4()`/`.ipv6()` variants. | ❌ No |
| [no-promise-schema](docs/rules/no-promise-schema.md) | Disallow `z.promise()`. Await before parsing. | ❌ No |
| [no-throw-in-refine](docs/rules/no-throw-in-refine.md) | Disallow `throw` inside `.refine()`/`.superRefine()`/`.transform()`. Use return patterns. | ❌ No |
| [require-enum-as-const](docs/rules/require-enum-as-const.md) | Require `as const` for arrays passed to `z.enum()`. | ❌ No |

### Best Practices (severity: warn)

These rules enforce Zod v4 best practices for optimal code quality.

| Rule | Description | Fixable |
|------|-------------|---------|
| [prefer-safeParse](docs/rules/prefer-safeParse.md) | Prefer `.safeParse()` over `.parse()` for explicit error handling. | ✅ Yes |
| [no-schema-in-render](docs/rules/no-schema-in-render.md) | Disallow creating schemas inside functions/components. **React-aware**: allows `useMemo`/`useCallback`. | ❌ No |
| [prefer-error-param](docs/rules/prefer-error-param.md) | Prefer `error` param over deprecated `message` param. | ✅ Yes |

## React Integration

### Schema Creation in Components

The `no-schema-in-render` rule is React-aware and recognizes memoization patterns:

```tsx
// ❌ Bad - Schema recreated every render
const MyComponent = () => {
  const schema = z.object({ name: z.string() })  // Error!
  return <Form schema={schema} />
}

// ✅ Good - Schema at module level
const schema = z.object({ name: z.string() })
const MyComponent = () => {
  return <Form schema={schema} />
}

// ✅ Good - Schema memoized with useMemo (for translated schemas)
const MyComponent = () => {
  const t = useTranslations()
  const schema = useMemo(() => z.object({
    email: z.email(t('invalidEmail')),
  }), [t])
  return <Form schema={schema} />
}

// ✅ Good - Factory function with useMemo
const createSchema = (t) => z.object({ email: z.email(t('error')) })
const MyComponent = () => {
  const t = useTranslations()
  const schema = useMemo(() => createSchema(t), [t])
  return <Form schema={schema} />
}
```

### TypeScript Workaround for `.check()` ctx.addIssue

When using `.check()`, TypeScript may incorrectly flag `ctx.addIssue()` calls:

```typescript
// If you see: @typescript-eslint/no-unsafe-call on ctx.addIssue()
// Add this comment to suppress the false positive:
.check((ctx) => {
  const { value: data } = ctx;
  if (!data.name) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Zod v4 ctx.addIssue is type-safe at runtime
    ctx.addIssue({ code: 'custom', message: 'Name required' });
  }
})
```

## Migration Guide

### From Zod v3 to v4

#### 1. String Format Methods

```javascript
// Before (deprecated)
z.string().email()
z.string().url()
z.string().uuid()

// After (v4)
z.email()
z.url()
z.uuid()
```

#### 2. Record Schema

```javascript
// Before (v3 - single argument)
z.record(z.string())

// After (v4 - two arguments)
z.record(z.string(), z.string())
```

#### 3. Error Parameters

```javascript
// Before (deprecated)
z.string({ invalid_type_error: "Must be string", required_error: "Required" })
z.string().refine(fn, { message: "Error" })

// After (v4)
z.string({ error: "Must be string" })
z.string().refine(fn, { error: "Error" })
// Or with function
z.string({ error: (iss) => `Error: ${iss.code}` })
```

#### 4. ZodError Methods

```javascript
// Before (deprecated)
error.format()
error.flatten()

// After (v4)
z.treeifyError(error)
```

#### 5. ZodError Property

```javascript
// Before (v3)
error.errors

// After (v4)
error.issues
```

#### 6. Schema Merging

```javascript
// Before (deprecated)
schema1.merge(schema2)

// After (v4)
schema1.extend(schema2.shape)
// Or
z.object({ ...schema1.shape, ...schema2.shape })
```

#### 7. Super Refine → Check

```javascript
// Before (deprecated)
schema.superRefine((val, ctx) => {
  if (!isValid(val)) {
    ctx.addIssue({ code: "custom", message: "Invalid" })
  }
})

// After (v4)
schema.check((ctx) => {
  const { value: val } = ctx;
  if (!isValid(val)) {
    ctx.addIssue({ code: "custom", message: "Invalid" })
  }
})

// Or for simple cases
schema.check((val) => isValid(val) || "Invalid")
```

#### 8. Object Methods

```javascript
// Before (deprecated)
z.object({ name: z.string() }).strict()
z.object({ name: z.string() }).passthrough()

// After (v4)
z.strictObject({ name: z.string() })
z.looseObject({ name: z.string() })
```

#### 9. Native Enums

```javascript
// Before (deprecated)
z.nativeEnum(MyEnum)

// After (v4)
z.enum(MyEnum)  // z.enum() now supports native enums
```

#### 10. IP and CIDR Validation

```javascript
// Before (removed)
z.string().ip()
z.string().cidr()

// After (v4)
z.ipv4()  // or z.ipv6()
z.cidrv4()  // or z.cidrv6()
z.union([z.ipv4(), z.ipv6()])  // for both
```

#### 11. Promise Schema

```javascript
// Before (deprecated)
z.promise(z.string())

// After (v4)
const data = await fetchData()
schema.parse(data)  // await before parsing
```

#### 12. Deep Partial

```javascript
// Before (removed)
schema.deepPartial()

// After (v4)
schema.partial()  // shallow only
// For deep partial, manually create nested partial schemas
```

## Changelog

### v0.3.0 (2025-02-21)

**New Rules:**
- `no-throw-in-refine`: Detects `throw` statements inside `.refine()`, `.superRefine()`, and `.transform()` callbacks. These errors are **not captured by Zod**, causing silent failures. The rule provides educational messages with correct patterns for each method.
- `require-enum-as-const`: Requires `as const` for arrays passed to `z.enum()`. Without it, TypeScript infers `string[]` instead of the literal union, breaking type inference.

**Improvements:**
- Added 61 new test cases (276 total tests passing)
- Updated documentation with migration examples for new rules

### v0.2.0 (2025-12-16)

**New Features:**
- `no-superrefine`: Now has **auto-fix** support! Transforms `.superRefine((data, ctx) => {...})` to `.check((ctx) => { const { value: data } = ctx; ...})`
- `no-schema-in-render`: Now **recognizes `useMemo` and `useCallback`** - schemas inside memoized callbacks are allowed
- Improved error messages with migration examples

**Bug Fixes:**
- Fixed false positives in `no-schema-in-render` when using React memoization hooks

### v0.1.1 (2025-12-15)

- Initial release with 15 rules (12 breaking changes + 3 best practices)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Matheus Pimenta** - [Koda AI Studio](https://kodaai.app)

Built with Claude Code.
