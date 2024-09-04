# TypeBox Extensions

[![License](https://img.shields.io/github/license/jcwillox/typebox-x?style=flat-square)](https://github.com/jcwillox/typebox-x/blob/main/LICENSE)
[![Version](https://img.shields.io/npm/v/@jcwillox/typebox-x?style=flat-square)](https://www.npmjs.com/package/@jcwillox/typebox-x)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jcwillox/typebox-x?style=flat-square)](https://bundlephobia.com/package/@jcwillox/typebox-x)
[![Publish Size](https://flat.badgen.net/packagephobia/publish/@jcwillox/typebox-x)](https://packagephobia.com/result?p=@jcwillox/typebox-x)
[![Code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

TypeBox extensions (typebox-x) is a utility library based around the [sinclairzx81/typebox](https://github.com/sinclairzx81/typebox) schema builder and validation library.

**Features**

- Validate and coerce environment variables (like [t3-env](https://env.t3.gg/docs/introduction)).
- Additional kinds and shorthands, e.g. `t.UUID`.
- Built in configuration for common formats, e.g. `date`, `email`, `uri`.
- Built in support for [NestJS](https://nestjs.com)

## Install

```bash
pnpm add @jcwillox/typebox-x @sinclair/typebox
```

## Load envs

First import the `createEnv` function, then pass it a typebox schema.

The `createEnv` function uses the clean, convert, default and decode function from typebox to parse you environment variables.

This means that it will strip extra keys, set default values, attempt to convert values to the destination type, e.g. `"true" -> true`, and then decode/check the value.

```ts
import { createEnv } from "@jcwillox/typebox-x";

const env = createEnv(
  t.Object({
    APP_ENV: t.Optional(t.String()),
    NODE_ENV: t.String({ default: "development" }),
    BOOL_FLAG: t.Boolean(),
  }),
);

console.log(env.BOOL_FLAG === true); // -> true
```

## Variants

**Nullable**

- Wraps schema in a union with null.
  ```ts
  t.Nullable(t.String());
  // t.Union([t.String(), t.Null()]);
  ```

**Nullish**

- Wraps schema in an optional union with null.
  ```ts
  t.Nullish(t.String());
  // t.Optional(t.Union([t.String(), t.Null()]));
  ```

**UUID**

- Shorthand for string of format `uuid`.
  ```ts
  t.UUID();
  // t.String({ format: "uuid" })
  ```

**DateString**

- Uses `Transform` to convert a string to a `Date` object when decoding and from a `Date` object to a string when encoding.
  ```ts
  t.DateString();
  ```

**RecordString**

- A replacement for `t.Record` that uses `t.String` as the key type, and adds the `additionalProperties` property, for backwards compatibility with OpenAPI 3.0.
  ```ts
  t.RecordString(t.Object({ one: t.String() }));
  // Record<string, {a: string}>
  ```
  Equivalent to:
  ```ts
  t.Record(t.String(), schema, {
    additionalProperties: schema,
  });
  ```

**StringEnum**

- Creates a union of strings with a `enum` schema representation
  ```ts
  t.StringEnum(["one", "two"]);
  ```

**LiteralEnum**

- Drop-in replacement for `t.Literal` that adds the `type` and `enum` properties, for backwards compatibility with OpenAPI 3.0.
- You should override `Literal` with this function, for OpenAPI 3.0 compatibility.
  ```ts
  t.LiteralEnum("one");
  ```

## Formats

Simply import `@jcwillox/typebox-x/formats` before you perform any validations, usually you'll want to do this in you entrypoint. If a format is already defined with the same name, it will not be overwritten.

```ts
import "@jcwillox/typebox-x/formats";
```

## NestJS

Use the typebox prefixed method decorators and provide the corresponding schemas.

```ts
import { Controller } from "@nestjs/common";
import { t } from "@jcwillox/typebox-x";
import { TypeboxGet } from "@jcwillox/typebox-x/nestjs";
// or if you prefer we also export non-prefixed methods
// import { Get } from "@jcwillox/typebox-x/nestjs";

@Controller()
export class AppController {
  @TypeboxGet(":my_id", {
    query: t.Object({
      limit: t.Optional(t.Integer({ default: 10 })),
    }),
    params: {
      my_id: t.UUID(),
    },
    response: t.Object({
      message: t.String(),
    }),
  })
  getHello() {
    return { message: "Hello World!" };
  }
}
```

You'll likely want to define your schemas outside the `@TypeboxGet` decorator, so you can also infer types from them,
using `Static<typeof schema>`.

```ts
import { Controller, Param, Query } from "@nestjs/common";
import { t } from "@jcwillox/typebox-x";
import { TypeboxGet } from "@jcwillox/typebox-x/nestjs";
import { Static } from "@sinclair/typebox";

type Query = Static<typeof QuerySchema>;
const QuerySchema = t.Object({
  limit: t.Optional(t.Integer({ default: 10 })),
});

type Response = Static<typeof ResponseSchema>;
const ResponseSchema = t.Object({
  message: t.String(),
});

@Controller()
export class AppController {
  @TypeboxGet(":my_id", {
    query: QuerySchema,
    params: { my_id: t.UUID() },
    response: ResponseSchema,
  })
  getHello(@Param("my_id") myId: string, @Query() query: Query): Response {
    return { message: "Hello World!" };
  }
}
```
