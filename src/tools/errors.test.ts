import "../formats";
import { TSchema, Type as t } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import { StringEnum, UnionOneOf } from "../openapi";
import { EnhanceErrorsOptions, enhanceErrors } from "./errors.ts";

const emailString = t.String({ format: "email" });
const enumObject = StringEnum(["one", "two", "three"]);

const testEnhance = (
  schema: TSchema,
  value: unknown,
  opts: EnhanceErrorsOptions = {},
) => [
  ...enhanceErrors(Value.Errors(schema, value), {
    formatPath: true,
    snakeCaseType: true,
    ...opts,
  }),
];

describe("enhanceErrors", () => {
  it("should handle prefix and String", () => {
    const result = testEnhance(emailString, "test", { prefix: "email" });
    expect(result).toMatchObject([
      {
        message: "Expected string to match 'email' format",
        type: "string_format",
        path: "email",
      },
    ]);
  });
  it("should handle Literal", () => {
    const result = testEnhance(t.Literal("one"), "test");
    expect(result).toMatchObject([
      {
        message: "Expected 'one'",
        type: "literal",
      },
    ]);
  });
  it("should handle UnionEnum", () => {
    const result = testEnhance(enumObject, "test");
    expect(result).toMatchObject([
      {
        message: "Expected one of the following: one, two, three",
        type: "union_enum",
      },
    ]);
  });
  it("should enhance UnionOneOf", () => {
    const result = testEnhance(
      UnionOneOf([t.Literal("one"), t.Literal("two"), t.Literal("three")]),
      "test",
    );
    expect(result).toMatchObject([
      {
        message: "Expected one of union value",
        type: "union_one_of",
      },
    ]);
  });
  it("should enhance nullish fields", () => {
    const result = testEnhance(
      t.Object({
        nullish: t.Union([emailString, t.Null()]),
        nested: t.Object({ nullish: t.Union([emailString, t.Null()]) }),
      }),
      { nullish: "test", nested: { nullish: "test" } },
    );
    expect(result).toMatchObject([
      {
        message: "Expected string to match 'email' format",
        type: "string_format",
        path: "nullish",
      },
      {
        message: "Expected null",
        type: "null",
        path: "nullish",
      },
      {
        message: "Expected string to match 'email' format",
        type: "string_format",
        path: "nested.nullish",
      },
      {
        message: "Expected null",
        type: "null",
        path: "nested.nullish",
      },
    ]);
  });
});
