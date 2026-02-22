# require-enum-as-const

Require arrays passed to `z.enum()` to have `as const` assertion for proper type inference.

## Rule Details

When you pass a mutable array variable to `z.enum()`, TypeScript infers the type as `string[]` instead of the literal union type. This loses the type safety benefits of Zod enums.

### The Problem

```typescript
// ❌ Bad - Type inferred as string[]
const roles = ['admin', 'user'];
z.enum(roles); // ZodEnum<string[]>

// The inferred type is string, not 'admin' | 'user'
const schema = z.enum(roles);
type Role = z.infer<typeof schema>; // string ❌
```

### The Solution

```typescript
// ✅ Good - Type inferred as readonly tuple
const roles = ['admin', 'user'] as const;
z.enum(roles); // ZodEnum<['admin', 'user']>

type Role = z.infer<typeof schema>; // 'admin' | 'user' ✅
```

## Examples

### Invalid (Reports Error)

```typescript
// Variable without as const
const roles = ['admin', 'user'];
z.enum(roles); // ❌

// Variable with string[] type
const roles: string[] = ['admin', 'user'];
z.enum(roles); // ❌

// let without as const
let roles = ['admin', 'user'];
z.enum(roles); // ❌

// Used in nested schema
const roles = ['admin'];
z.object({ role: z.enum(roles) }); // ❌
```

### Valid (No Error)

```typescript
// Inline array - Zod v4 handles this correctly
z.enum(['admin', 'user']); // ✅

// Variable with as const
const roles = ['admin', 'user'] as const;
z.enum(roles); // ✅

// Using as const at call site
const roles = ['admin', 'user'];
z.enum(roles as const); // ✅

// Imported from another module (can't control)
import { roles } from './constants';
z.enum(roles); // ✅
```

## Edge Cases

### Imported Variables

Variables imported from other modules are not reported since you cannot add `as const` to them:

```typescript
import { roles } from './constants';
z.enum(roles); // ✅ No error - out of your control
```

If you need type safety with imported arrays, either:
1. Add `as const` in the source module
2. Cast at the call site: `z.enum(roles as const)`

### Inline Arrays

Zod v4 correctly infers types from inline arrays without needing `as const`:

```typescript
z.enum(['admin', 'user']); // ✅ Works in Zod v4
```

This is valid and does not trigger the rule.

### Unknown Variables

If the variable declaration cannot be found (e.g., global variables), the rule does not report:

```typescript
z.enum(unknownGlobal); // ✅ No error
```

## When Not to Use It

If you don't care about having precise literal types for your enums, or if you're working with dynamic arrays that change at runtime, you might want to disable this rule.

## Options

This rule has no options.
