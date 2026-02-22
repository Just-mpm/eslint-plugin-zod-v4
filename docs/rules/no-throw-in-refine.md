# no-throw-in-refine

Disallow `throw` statements inside `.refine()`, `.superRefine()`, and `.transform()` callbacks.

## Rule Details

Throwing inside Zod validation callbacks is problematic because:

1. **Errors are not captured** - Zod's error handling expects validation failures to be signaled through return values or `ctx.addIssue()`, not thrown errors
2. **Unexpected behavior** - Thrown errors bypass Zod's validation pipeline and can crash your application
3. **Inconsistent error handling** - Mixes two different error handling paradigms

## Examples

### `.refine()`

```javascript
// ❌ Bad - throw inside refine
z.string().refine((val) => {
  if (!val) throw new Error('Empty');
  return true;
})

// ✅ Good - return falsy value to signal failure
z.string().refine((val) => val.length > 0 || 'Value is too short')

// ✅ Good - return boolean
z.string().refine((val) => val.length > 0, { error: 'Value is too short' })
```

### `.transform()`

```javascript
// ❌ Bad - throw inside transform
z.string().transform((val) => {
  if (!val) throw new Error('Empty');
  return val.toUpperCase();
})

// ✅ Good - use ctx.issues.push() and return z.NEVER
z.string().transform((val, ctx) => {
  if (!val) {
    ctx.issues.push({ code: 'custom', message: 'Empty' });
    return z.NEVER;
  }
  return val.toUpperCase();
})

// ✅ Good - simple transformation
z.string().transform((val) => val.toUpperCase())
```

### `.superRefine()`

```javascript
// ❌ Bad - throw inside superRefine
z.string().superRefine((val, ctx) => {
  if (!val) throw new Error('Empty');
})

// ✅ Good - use ctx.addIssue()
z.string().superRefine((val, ctx) => {
  if (!val) {
    ctx.addIssue({ code: 'custom', message: 'Empty' });
  }
})
```

## Edge Cases

### Nested Functions

Throws inside nested functions are allowed since they don't affect the callback's validation flow:

```javascript
// ✅ Allowed - throw is inside nested function
z.string().refine((val) => {
  const helper = () => { throw new Error(); };
  return true;
})
```

### Try/Catch Blocks

Throws inside `try` blocks are allowed since they are being handled:

```javascript
// ✅ Allowed - throw is handled by catch
z.string().refine((val) => {
  try {
    validate(val);
    return true;
  } catch {
    return false;
  }
})

// ❌ Still reports - throw in catch block is not handled
z.string().refine((val) => {
  try {
    validate(val);
  } catch {
    throw new Error('Re-throw'); // This is reported!
  }
  return true;
})
```

### Arrow Functions with Expression Body

Arrow functions without block bodies cannot contain throw statements, so they are always valid:

```javascript
// ✅ Always valid - no block body
z.string().refine((val) => val.length > 0)
z.string().refine((val) => val || 'Required')
```

## When Not to Use It

If you have a specific use case where throwing inside these callbacks is intentional and desired, you can disable this rule. However, this is generally not recommended.

## Options

This rule has no options.
