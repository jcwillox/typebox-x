import { Type as t } from "@sinclair/typebox";
import { describe, expect, it } from "vitest";
import { downgradeSchema } from "./downgrade.ts";
import { LiteralEnum } from "./kinds";

const nullableUnion = t.Union([t.Null(), t.String()]);
const nullableUnionExpected = t.String({ nullable: true });
const literalConst = t.Literal("test");
const literalConstExpected = LiteralEnum("test");
const emailString = t.String({ format: "email" });

const objectSchema = t.Object({
  one: nullableUnion,
  two: literalConst,
  three: emailString,
});
const objectSchemaExpected = t.Object({
  one: nullableUnionExpected,
  two: literalConstExpected,
  three: emailString,
});

const compositeSchema = t.Object({
  intersection: t.Intersect([nullableUnion, literalConst, emailString]),
  object: objectSchema,
  array1: t.Array(nullableUnion),
  array2: t.Array(literalConst),
  array3: t.Array(objectSchema),
  email: emailString,
});
const compositeSchemaExpected = t.Object({
  intersection: t.Intersect([
    nullableUnionExpected,
    literalConstExpected,
    emailString,
  ]),
  object: objectSchemaExpected,
  array1: t.Array(nullableUnionExpected),
  array2: t.Array(literalConstExpected),
  array3: t.Array(objectSchemaExpected),
  email: emailString,
});

describe("downgradeSchema", () => {
  it("downgrades nullable union", () => {
    expect(downgradeSchema(nullableUnion)).toEqual(nullableUnionExpected);
  });
  it("downgrades literal const", () => {
    expect(downgradeSchema(literalConst)).toEqual(literalConstExpected);
  });
  it("downgrades object", () => {
    expect(downgradeSchema(objectSchema)).toEqual(objectSchemaExpected);
  });
  it("downgrades composite", () => {
    expect(downgradeSchema(compositeSchema)).toEqual(compositeSchemaExpected);
  });
});
