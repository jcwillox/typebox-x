import { Type } from "@sinclair/typebox";
import {
  DateString,
  Nullable,
  Nullish,
  RecordString,
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
});
