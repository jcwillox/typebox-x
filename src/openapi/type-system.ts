import { Type as t } from "@sinclair/typebox";
import {
  DateString,
  Nullable,
  Nullish,
  RecordString,
  UUID,
  UnionEnum,
  UnionOneOf,
} from "./kinds";

declare module "@sinclair/typebox" {
  interface JavaScriptTypeBuilder {
    UnionOneOf: typeof UnionOneOf;
    UnionEnum: typeof UnionEnum;
    Nullable: typeof Nullable;
    Nullish: typeof Nullish;
    UUID: typeof UUID;
    DateString: typeof DateString;
    RecordString: typeof RecordString;
  }
}

t.UnionOneOf = UnionOneOf;
t.UnionEnum = UnionEnum;
t.Nullable = Nullable;
t.Nullish = Nullish;
t.UUID = UUID;
t.DateString = DateString;
t.RecordString = RecordString;

export { t };
