import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Value } from "@sinclair/typebox/value";
import { map } from "rxjs";
import { cacheCompile } from "../tools";
import { TypeBoxOptions } from "./decorators.ts";

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
        return compiler.Encode(value);
      }),
    );
  }
}
