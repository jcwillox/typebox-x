import { KindGuard } from "@sinclair/typebox";
import { Value, ValueError, ValueErrorType } from "@sinclair/typebox/value";
import { snake } from "radash";

export type EnhanceErrorsOptions = {
  /**
   * Prefix to add to the path of each error.
   *
   * Useful if you want to avoid empty paths.
   */
  prefix?: string;
  /**
   * Converts TypeBox's `/` based JSON path to a `.` based path.
   *
   * Uses {@link formatTypeBoxPath}.
   *
   * Dot-path notion is usually better supported in most libraries.
   */
  formatPath?: boolean;
  /**
   * Convert error types to snake case.
   *
   * This is usually preferred for API responses.
   *
   * Implicitly sets `useTypeName` to `true`.
   * ```
   * "ArrayMinItems" -> "array_min_items"
   * ```
   */
  snakeCaseType?: boolean;
};

type EnhancedValueError = Omit<ValueError, "type"> & {
  type: string;
};

/**
 * Apply various transformations to the errors, to improve the output.
 * @param errors - The errors to enhance.
 * @param opts - Options to customize the transformations.
 */
export function* enhanceErrors(
  errors: Iterable<ValueError>,
  opts: EnhanceErrorsOptions = {},
): Generator<EnhancedValueError> {
  for (const error of errors) {
    // enhance path
    if (opts.prefix) {
      error.path = error.path ? `${opts.prefix}.${error.path}` : opts.prefix;
    }
    if (opts.formatPath) {
      error.path = formatTypeBoxPath(error.path);
    }

    // enhance type
    let type = ValueErrorType[error.type];

    // enhance kind
    if (error.type === ValueErrorType.Kind) {
      if (KindGuard.IsKindOf(error.schema, "UnionEnum")) {
        error.message =
          "Expected one of the following: " + error.schema.enum.join(", ");
        type = "UnionEnum";
      }
      if (KindGuard.IsKindOf(error.schema, "UnionOneOf")) {
        error.message = "Expected one of union value";
        type = "UnionOneOf";
      }
    }

    // improve nullish unions
    if (
      error.type === ValueErrorType.Union &&
      KindGuard.IsUnion(error.schema) &&
      error.schema.anyOf.length === 2 &&
      error.schema.anyOf.some(KindGuard.IsNull)
    ) {
      for (const schema_ of error.schema.anyOf)
        yield* enhanceErrors(Value.Errors(schema_, error.value), {
          ...opts,
          prefix: error.path,
        });
      continue;
    }

    // enhance type
    if (opts.snakeCaseType) {
      type = snake(type);
    }

    yield { ...error, type };
  }
}

type BasicValueError = Omit<ValueError, "type" | "message" | "errors">;
export type MergedNumericValueError = BasicValueError & {
  errors: Record<number, string>;
};
export type MergedStringValueError = BasicValueError & {
  errors: Record<string, string>;
};
export type MergedValueError = BasicValueError & {
  errors: Record<string | number, string>;
};

/**
 * Merges multiple errors for a path into a single object per path,
 * with an array of errors, see {@link MergedValueError}.
 *
 * @param errors - The errors to merge.
 * @param stripEmptyPaths - Whether to strip errors with empty paths.
 */
export function mergeErrors(
  errors: Iterable<ValueError>,
  stripEmptyPaths?: boolean,
): MergedNumericValueError[];
export function mergeErrors(
  errors: Iterable<EnhancedValueError>,
  stripEmptyPaths?: boolean,
): MergedStringValueError[];
export function mergeErrors(
  errors: Iterable<ValueError> | Iterable<EnhancedValueError>,
  stripEmptyPaths?: boolean,
): MergedValueError[] {
  const mergedErrors: Record<string, MergedValueError> = {};
  for (const { message, type, ...error } of errors) {
    if (error.path in mergedErrors) {
      mergedErrors[error.path].errors[type] = message;
    } else if (!stripEmptyPaths || error.path) {
      mergedErrors[error.path] = {
        ...error,
        errors: { [type]: message },
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
