import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { TransformEncodeCheckError, Value } from "@sinclair/typebox/value";
import { map } from "rxjs";
import { cacheCompile } from "../tools";
import { TypeBoxOptions } from "./decorators.ts";
import { TypeBoxMissingSchemaError, throwValidationError } from "./errors.ts";

@Injectable()
export class TypeBoxInterceptor implements NestInterceptor {
  constructor(private readonly options: TypeBoxOptions) {}
  intercept(_: ExecutionContext, next: CallHandler) {
    if (!this.options.response) return next.handle();
    const compiler = cacheCompile(this.options.response);
    return next.handle().pipe(
      map((value) => {
        if (!this.options.response) {
          if (this.options.required?.response)
            throw new TypeBoxMissingSchemaError("response");
          return value;
        }
        value = Value.Clean(this.options.response, value);
        try {
          return compiler.Encode(value);
        } catch (err) {
          if (err instanceof TransformEncodeCheckError)
            throwValidationError(err, compiler, this.options.errorFactory);
          else throw err;
        }
      }),
    );
  }
}
