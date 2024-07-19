import { ValueErrorIterator } from "@sinclair/typebox/errors";
import { ValueError, ValueErrorType } from "@sinclair/typebox/value";

export type MergedValueError = Omit<ValueError, "type" | "message"> & {
  errors: {
    type: ValueErrorType;
    message: string;
  }[];
};

/**
 * Merges multiple errors for a path into a single object per path,
 * with an array of errors, see {@link MergedValueError}.
 *
 * @param errors - The errors to merge.
 * @param stripEmptyPaths - Whether to strip errors with empty paths.
 */
export function mergeErrors(
  errors: ValueErrorIterator | ValueError[],
  stripEmptyPaths = true,
): MergedValueError[] {
  const mergedErrors: Record<string, MergedValueError> = {};
  for (const { message, type, ...error } of errors) {
    if (error.path in mergedErrors) {
      mergedErrors[error.path].errors.push({ type, message });
    } else if (!stripEmptyPaths || error.path) {
      mergedErrors[error.path] = {
        ...error,
        errors: [{ type, message }],
      };
    }
  }
  return Object.values(mergedErrors);
}

/**
 * Converts TypeBox's `/` based JSON path to a `.` based path.
 *
 * @example
 * formatTypeBoxPath("/a/b/c") // -> "a.b.c"
 */
export function formatTypeBoxPath(path: string) {
  path = path[0] === "/" ? path.slice(1) : path;
  return path.replaceAll("/", ".");
}
