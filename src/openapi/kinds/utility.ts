import {
  ObjectOptions,
  SchemaOptions,
  StringOptions,
  TLiteral,
  TLiteralValue,
  TRecord,
  TSchema,
  TString,
  TTransform,
  Type as t,
} from "@sinclair/typebox";
import { TUnionEnum, UnionEnum } from "./experimental.ts";

export function Nullable<T extends TSchema>(schema: T) {
  return t.Union([schema, t.Null()]);
}

/** Creates a schema that allows `null` and `undefined` values. */
export function Nullish<T extends TSchema>(schema: T) {
  return t.Optional(t.Union([schema, t.Null()]));
}

export function UUID(options?: StringOptions): TString {
  return t.String({ format: "uuid", ...options });
}

/**
 * Resulting schema object is a string with the `date-time` format, the typescript
 * type is of `Date`.
 *
 * Strings are coerced to dates during decode and stringify during encode.
 * If you do not use decode, the value will be a string.
 */
export function DateString(options?: StringOptions): TTransform<TString, Date> {
  return t
    .Transform(t.String({ format: "date-time", ...options }))
    .Decode((x) => new Date(x))
    .Encode((x) => x.toISOString());
}

/**
 * Creates a valid record map for OpenAPI 3.0, as it does not support
 * `patternProperties` which is what typebox uses for the default `Record` kind.
 */
export function RecordString<T extends TSchema>(
  schema: T,
  options?: ObjectOptions,
): TRecord<TString, T> {
  return t.Record(t.String(), schema, {
    additionalProperties: schema,
    ...options,
  });
}

/** Creates a union of strings with a `enum` schema representation */
export function StringEnum<T extends string[]>(
  values: [...T],
  options?: SchemaOptions,
): TUnionEnum<T> {
  return UnionEnum(values, { type: "string", ...options });
}

/**
 * Drop-in replacement for `t.Literal` that adds the `type` and `enum` properties,
 * for backwards compatibility with OpenAPI 3.0.
 *
 * You should override `Literal` with this function, for OpenAPI 3.0 compatibility.
 */
export function LiteralEnum<T extends TLiteralValue>(
  value: T,
  options?: SchemaOptions,
): TLiteral<T> {
  switch (typeof value) {
    case "boolean":
      return t.Literal(value, { type: "boolean", enum: [value], ...options });
    case "number":
      return t.Literal(value, { type: "number", enum: [value], ...options });
    case "string":
      return t.Literal(value, { type: "string", enum: [value], ...options });
    default:
      return t.Literal(value, options);
  }
}
