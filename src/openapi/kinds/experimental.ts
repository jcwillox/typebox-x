/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Kind,
  SchemaOptions,
  Static,
  TSchema,
  TypeRegistry,
} from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/* TYPEBOX PROTOTYPES */

export interface TUnionOneOf<T extends TSchema[]> extends TSchema {
  [Kind]: "UnionOneOf";
  static: { [K in keyof T]: Static<T[K]> }[number];
  oneOf: T;
}
/** `[Experimental]` Creates a Union type with a `oneOf` schema representation */
export function UnionOneOf<T extends TSchema[]>(
  oneOf: [...T],
  options: SchemaOptions = {},
) {
  function UnionOneOfCheck(schema: TUnionOneOf<TSchema[]>, value: unknown) {
    return (
      1 ===
      schema.oneOf.reduce(
        (acc: number, schema: any) =>
          Value.Check(schema, value) ? acc + 1 : acc,
        0,
      )
    );
  }
  if (!TypeRegistry.Has("UnionOneOf"))
    TypeRegistry.Set("UnionOneOf", UnionOneOfCheck);
  return { ...options, [Kind]: "UnionOneOf", oneOf } as TUnionOneOf<T>;
}

export interface TUnionEnum<T extends (string | number)[]> extends TSchema {
  [Kind]: "UnionEnum";
  static: T[number];
  enum: T;
}
/** `[Experimental]` Creates a Union type with a `enum` schema representation  */
export function UnionEnum<T extends (string | number)[]>(
  values: [...T],
  options: SchemaOptions = {},
) {
  function UnionEnumCheck(
    schema: TUnionEnum<(string | number)[]>,
    value: unknown,
  ) {
    return (
      (typeof value === "string" || typeof value === "number") &&
      schema.enum.includes(value)
    );
  }
  if (!TypeRegistry.Has("UnionEnum"))
    TypeRegistry.Set("UnionEnum", UnionEnumCheck);
  return { ...options, [Kind]: "UnionEnum", enum: values } as TUnionEnum<T>;
}
