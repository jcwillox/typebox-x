import { TSchema, TypeBoxError } from "@sinclair/typebox";
import { TypeCheck } from "@sinclair/typebox/compiler";
import { ValueErrorIterator } from "@sinclair/typebox/errors";
import {
  TransformDecodeCheckError,
  TransformEncodeCheckError,
  ValueError,
} from "@sinclair/typebox/value";

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
