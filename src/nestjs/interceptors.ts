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
import { TypeBoxValidationError } from "./errors.ts";

@Injectable()
export class TypeBoxInterceptor implements NestInterceptor {
  constructor(private readonly options: TypeBoxOptions) {}
  intercept(_: ExecutionContext, next: CallHandler) {
    if (!this.options.response) return next.handle();
    const compiler = cacheCompile(this.options.response);
    return next.handle().pipe(
      map((value) => {
        if (!this.options.response) return value;
        value = Value.Clean(this.options.response, value);
        try {
          return compiler.Encode(value);
        } catch (err) {
          if (err instanceof TransformEncodeCheckError)
            throw new TypeBoxValidationError(err, compiler);
          throw err;
        }
      }),
    );
  }
}
