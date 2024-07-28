import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import {
  HasTransform,
  TransformEncode,
  TransformEncodeCheckError,
  Value,
} from "@sinclair/typebox/value";
import { map } from "rxjs";
import { cacheCompile } from "../tools";
import type { TypeBoxOpts } from "./decorators.ts";
import { throwMissingSchemaError, throwValidationError } from "./errors.ts";

@Injectable()
export class TypeBoxInterceptor implements NestInterceptor {
  constructor(private readonly options: TypeBoxOpts) {}
  intercept(_: ExecutionContext, next: CallHandler) {
    if (!this.options.response && !this.options.required?.response)
      return next.handle();

    const hasTransform = this.options.response
      ? HasTransform(this.options.response, [])
      : false;

    return next.handle().pipe(
      map((value) => {
        if (!this.options.response) {
          if (value !== undefined && this.options.required?.response)
            throwMissingSchemaError("response", undefined, this.options);
          return value;
        }

        if (this.options.validateResponse !== false) {
          const compiler = cacheCompile(this.options.response);
          try {
            return Value.Clean(this.options.response, compiler.Encode(value));
          } catch (err) {
            if (err instanceof TransformEncodeCheckError)
              throwValidationError(err, compiler, this.options.errorFactory);
            else throw err;
          }
        }

        const encoded = hasTransform
          ? TransformEncode(this.options.response, [], value)
          : value;

        return Value.Clean(this.options.response, encoded);
      }),
    );
  }
}
