import { StringOptions, TSchema, TString, Type as t } from "@sinclair/typebox";

export function Nullable<T extends TSchema>(schema: T) {
  return t.Union([schema, t.Null()]);
}

export function Nullish<T extends TSchema>(schema: T) {
  return t.Optional(t.Union([schema, t.Null()]));
}

export function UUID(options?: StringOptions): TString {
  return t.String({ format: "uuid", ...options });
}
