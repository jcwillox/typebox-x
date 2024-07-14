import { FormatRegistry } from "@sinclair/typebox";
import { isDate, isEmail, isISO8601, isURL, isUUID } from "validator";

if (!FormatRegistry.Has("date")) {
  FormatRegistry.Set("date", (value) => {
    return isDate(value);
  });
}

if (!FormatRegistry.Has("date-time")) {
  FormatRegistry.Set("date-time", (value) => {
    return isISO8601(value);
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
    return isUUID(value);
  });
}
