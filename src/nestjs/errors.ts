import { TSchema, TypeBoxError } from "@sinclair/typebox";
import { TypeCheck } from "@sinclair/typebox/compiler";
import { ValueErrorIterator } from "@sinclair/typebox/errors";
import {
  TransformDecodeCheckError,
  TransformEncodeCheckError,
  ValueError,
} from "@sinclair/typebox/value";
import { TypeBoxOpts } from "./decorators.ts";

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
  readonly type: string;
  readonly param?: string;

  constructor(
    err: TransformDecodeCheckError | TransformEncodeCheckError,
    compiler: TypeCheck<T>,
    type: "query" | "body" | "response" | "param",
    param?: string,
  ) {
    super(err.message);
    this.type = type;
    this.param = param;
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
  errorFactory: TypeBoxOpts["errorFactory"],
  type: "query" | "body" | "response" | "param",
  param?: string,
) {
  const validationError = new TypeBoxValidationError(
    err,
    compiler,
    type,
    param,
  );
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

export function throwMissingSchemaError(
  type: string,
  param: string | undefined,
  options: TypeBoxOpts,
) {
  const schemaError = new TypeBoxMissingSchemaError(type, param);
  if (options.required?.errorFactory) {
    const newErr = options.required.errorFactory(schemaError);
    if (newErr) throw newErr;
  } else {
    throw schemaError;
  }
}
