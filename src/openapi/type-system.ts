import { Type as t } from "@sinclair/typebox";
import { Nullable, Nullish, UUID, UnionEnum, UnionOneOf } from "./kinds";

declare module "@sinclair/typebox" {
  interface JavaScriptTypeBuilder {
    UnionOneOf: typeof UnionOneOf;
    UnionEnum: typeof UnionEnum;
    Nullable: typeof Nullable;
    Nullish: typeof Nullish;
    UUID: typeof UUID;
  }
}

t.UnionOneOf = UnionOneOf;
t.UnionEnum = UnionEnum;
t.Nullable = Nullable;
t.Nullish = Nullish;
t.UUID = UUID;

export { t };
