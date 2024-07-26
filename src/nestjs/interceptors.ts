import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { TransformEncodeCheckError, Value } from "@sinclair/typebox/value";
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
    return next.handle().pipe(
      map((value) => {
        if (!this.options.response) {
          if (value !== undefined && this.options.required?.response)
            throwMissingSchemaError("response", undefined, this.options);
          return value;
        }
        const compiler = cacheCompile(this.options.response);
        value = Value.Clean(this.options.response, value);
        try {
          return compiler.Encode(value);
        } catch (err) {
          if (err instanceof TransformEncodeCheckError)
            throwValidationError(err, compiler, this.options.errorFactory);
          else throw err;
        }
        return value;
      }),
    );
  }
}
