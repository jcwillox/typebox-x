import { FormatRegistry } from "@sinclair/typebox";
import isDate from "validator/lib/isDate";
import isEmail from "validator/lib/isEmail";
import isISO8601 from "validator/lib/isISO8601";
import isURL from "validator/lib/isURL";
import isUUID from "validator/lib/isUUID";

if (!FormatRegistry.Has("date")) {
  FormatRegistry.Set("date", (value) => {
    return isDate(value);
  });
}

if (!FormatRegistry.Has("date-time")) {
  FormatRegistry.Set("date-time", (value) => {
    return isISO8601(value) && !isNaN(Date.parse(value));
  });
}

if (!FormatRegistry.Has("email")) {
  FormatRegistry.Set("email", (value) => {
    return isEmail(value);
  });
}

if (!FormatRegistry.Has("uri")) {
  FormatRegistry.Set("uri", (value) => {
    return isURL(value);
  });
}

if (!FormatRegistry.Has("uuid")) {
  FormatRegistry.Set("uuid", (value) => {
    return isUUID(value, 4);
  });
}

if (!FormatRegistry.Has("color-hex")) {
  const MATCH_COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;
  FormatRegistry.Set("color-hex", (value) => {
    return MATCH_COLOR_HEX.test(value);
  });
}
