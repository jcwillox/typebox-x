import { FormatRegistry } from "@sinclair/typebox";
import isDate from "validator/lib/isDate.js";
import isEmail from "validator/lib/isEmail.js";
import isISO8601 from "validator/lib/isISO8601.js";
import isLocale from "validator/lib/isLocale.js";
import isURL from "validator/lib/isURL.js";
import isUUID from "validator/lib/isUUID.js";

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

if (!FormatRegistry.Has("locale")) {
  FormatRegistry.Set("locale", (value) => {
    return isLocale(value);
  });
}

const MATCH_DECIMAL = /^-?\d+(\.\d+)?$/;
if (!FormatRegistry.Has("float")) {
  FormatRegistry.Set("float", (value) => MATCH_DECIMAL.test(value));
}
if (!FormatRegistry.Has("double")) {
  FormatRegistry.Set("double", (value) => MATCH_DECIMAL.test(value));
}
if (!FormatRegistry.Has("decimal")) {
  FormatRegistry.Set("decimal", (value) => MATCH_DECIMAL.test(value));
}

if (!FormatRegistry.Has("+decimal")) {
  const MATCH_POSITIVE_DECIMAL = /^\d+(\.\d+)?$/;
  FormatRegistry.Set("+decimal", (value) => MATCH_POSITIVE_DECIMAL.test(value));
}
