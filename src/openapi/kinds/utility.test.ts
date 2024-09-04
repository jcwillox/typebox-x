import { Kind } from "@sinclair/typebox";
import { describe, expect, it } from "vitest";
import { LiteralEnum } from "./utility";

describe("LiteralEnum", () => {
  it("handles boolean literal", () => {
    const schema = LiteralEnum(true);
    expect(schema).toEqual({
      [Kind]: "Literal",
      type: "boolean",
      enum: [true],
      const: true,
    });
  });

  it("handles number literal", () => {
    const schema = LiteralEnum(42);
    expect(schema).toEqual({
      [Kind]: "Literal",
      type: "number",
      enum: [42],
      const: 42,
    });
  });

  it("handles string literal", () => {
    const schema = LiteralEnum("test");
    expect(schema).toEqual({
      [Kind]: "Literal",
      type: "string",
      enum: ["test"],
      const: "test",
    });
  });

  it("handles additional options", () => {
    const schema = LiteralEnum("test", { description: "A test string" });
    expect(schema).toEqual({
      [Kind]: "Literal",
      type: "string",
      enum: ["test"],
      const: "test",
      description: "A test string",
    });
  });
});
