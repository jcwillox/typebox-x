import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { Value } from "@sinclair/typebox/value";
import { cacheCompile } from "../tools";
import { TypeBoxOptions } from "./decorators.ts";

@Injectable()
export class TypeboxPipe implements PipeTransform {
  constructor(private readonly options: TypeBoxOptions) {}
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === "body" && this.options.body) {
      const compiler = cacheCompile(this.options.body);
      value = Value.Clean(this.options.body, value);
      return compiler.Decode(value);
    }

    if (metadata.type === "query" && this.options.query) {
      const compiler = cacheCompile(this.options.query);
      value = Value.Clean(this.options.query, value);
      value = Value.Convert(this.options.query, value);
      value = Value.Default(this.options.query, value);
      return compiler.Decode(value);
    }

    if (metadata.type === "param" && metadata.data && this.options.params) {
      const schema = this.options.params[metadata.data];
      if (!schema) return value;
      const compiler = cacheCompile(schema);
      value = Value.Clean(schema, value);
      value = Value.Convert(schema, value);
      return compiler.Decode(value);
    }

    return value;
  }
}
