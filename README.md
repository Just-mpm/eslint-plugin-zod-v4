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
| [no-deprecated-string-format](docs/rules/no-deprecated-string-format.md) | Disallow `z.string().email()` etc. Use `z.email()` instead. | Yes |
| [no-record-single-arg](docs/rules/no-record-single-arg.md) | Require `z.record(keySchema, valueSchema)` with two arguments. | No |
| [no-deprecated-error-params](docs/rules/no-deprecated-error-params.md) | Disallow `invalid_type_error`/`required_error`. Use `error` param. | Yes |
| [no-deprecated-format-methods](docs/rules/no-deprecated-format-methods.md) | Disallow `.format()`/`.flatten()` on ZodError. Use `z.treeifyError()`. | No |
| [no-merge-method](docs/rules/no-merge-method.md) | Disallow `.merge()`. Use `.extend()` instead. | No |
| [no-superrefine](docs/rules/no-superrefine.md) | Disallow `.superRefine()`. Use `.check()` instead. | No |
| [no-errors-property](docs/rules/no-errors-property.md) | Disallow `error.errors`. Use `error.issues` instead. | Yes |
| [no-deprecated-object-methods](docs/rules/no-deprecated-object-methods.md) | Disallow `.strict()`/`.passthrough()`/`.strip()`. Use top-level functions. | No |
| [no-native-enum](docs/rules/no-native-enum.md) | Disallow `z.nativeEnum()`. Use `z.enum()` instead. | No |
| [no-deep-partial](docs/rules/no-deep-partial.md) | Disallow `.deepPartial()` (removed in v4). | No |
| [no-deprecated-ip-methods](docs/rules/no-deprecated-ip-methods.md) | Disallow `.ip()`/`.cidr()`. Use `.ipv4()`/`.ipv6()` variants. | No |
| [no-promise-schema](docs/rules/no-promise-schema.md) | Disallow `z.promise()`. Await before parsing. | No |

### Best Practices (severity: warn)

These rules enforce Zod v4 best practices for optimal code quality.

| Rule | Description | Fixable |
|------|-------------|---------|
| [prefer-safeParse](docs/rules/prefer-safeParse.md) | Prefer `.safeParse()` over `.parse()` for explicit error handling. | Yes |
| [no-schema-in-render](docs/rules/no-schema-in-render.md) | Disallow creating schemas inside functions/components. | No |
| [prefer-error-param](docs/rules/prefer-error-param.md) | Prefer `error` param over deprecated `message` param. | Yes |

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

// After (v4)
z.string({ error: "Must be string" })
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

#### 7. Super Refine

```javascript
// Before (deprecated)
schema.superRefine((val, ctx) => {
  if (!isValid(val)) {
    ctx.addIssue({ code: "custom", message: "Invalid" })
  }
})

// After (v4)
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

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Matheus Pimenta** - [Koda AI Studio](https://kodaai.app)

Built with Claude Code.
