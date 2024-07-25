import { TSchema, TypeBoxError } from "@sinclair/typebox";
import { TypeCheck } from "@sinclair/typebox/compiler";
import { ValueErrorIterator } from "@sinclair/typebox/errors";
import {
  TransformDecodeCheckError,
  TransformEncodeCheckError,
  ValueError,
} from "@sinclair/typebox/value";
import { TypeBoxOptions } from "./decorators.ts";

/**
 * Thrown when a validation check fails from either validation pipe or
 * response interceptor.
 *
 * It provides the same properties as the underlying decode and encode errors,
 * except it also provide access to the compiled `Errors` iterator.
 */
export class TypeBoxValidationError<T extends TSchema> extends TypeBoxError {
  readonly schema: TSchema;
  readonly value: unknown;
  readonly error: ValueError;
  readonly errors: ValueErrorIterator;
  readonly cause: TransformDecodeCheckError | TransformEncodeCheckError;

  constructor(
    err: TransformDecodeCheckError | TransformEncodeCheckError,
    compiler: TypeCheck<T>,
  ) {
    super(err.message);
    this.schema = err.schema;
    this.value = err.value;
    this.error = err.error;
    this.errors = compiler.Errors(err.value);
    this.cause = err;
  }
}

export function throwValidationError<T extends TSchema>(
  err: TransformDecodeCheckError | TransformEncodeCheckError,
  compiler: TypeCheck<T>,
  errorFactory: TypeBoxOptions["errorFactory"],
) {
  const validationError = new TypeBoxValidationError(err, compiler);
  if (errorFactory) {
    const newErr = errorFactory(validationError);
    if (newErr) throw newErr;
  } else {
    throw validationError;
  }
}

/**
 * Thrown during validation when a schema is missing from the options object.
 */
export class TypeBoxMissingSchemaError extends TypeBoxError {
  constructor(
    public readonly type: string,
    public readonly param?: string,
  ) {
    super(
      type === "param"
        ? `Missing schema for "${param}" ${type}`
        : `Missing ${type} schema`,
    );
  }
}
