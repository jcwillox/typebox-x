import { Type } from "@sinclair/typebox";
import {
  DateString,
  LiteralEnum,
  Nullable,
  Nullish,
  RecordString,
  StringEnum,
  UUID,
  UnionEnum,
  UnionOneOf,
} from "./kinds";

export const t = Object.assign({}, Type, {
  UnionOneOf,
  UnionEnum,
  Nullable,
  Nullish,
  UUID,
  DateString,
  RecordString,
  StringEnum,
  LiteralEnum,
});
