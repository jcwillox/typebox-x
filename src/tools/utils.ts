import { ValueErrorIterator } from "@sinclair/typebox/errors";
import { ValueError, ValueErrorType } from "@sinclair/typebox/value";

export type MergedValueError = Omit<ValueError, "type" | "message"> & {
  errors: {
    type: ValueErrorType;
    message: string;
  }[];
};

export function mergeErrors(errors: ValueErrorIterator): MergedValueError[] {
  const mergedErrors: Record<string, MergedValueError> = {};
  for (const { message, type, ...error } of errors) {
    if (error.path in mergedErrors) {
      mergedErrors[error.path].errors.push({ type, message });
    } else {
      mergedErrors[error.path] = {
        ...error,
        errors: [{ type, message }],
      };
    }
  }
  return Object.values(mergedErrors);
}

export function formatTypeBoxPath(path: string) {
  path = path[0].startsWith("/") ? path.slice(1) : path;
  return path.replaceAll("/", ".");
}
