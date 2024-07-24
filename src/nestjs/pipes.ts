import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { TypeGuard } from "@sinclair/typebox";
import { TransformDecodeCheckError, Value } from "@sinclair/typebox/value";
import { cacheCompile } from "../tools";
import { TypeBoxOptions } from "./decorators.ts";
import { TypeBoxValidationError } from "./errors.ts";

@Injectable()
export class TypeboxPipe implements PipeTransform {
  constructor(private readonly options: TypeBoxOptions) {}
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === "body" && this.options.body) {
      const compiler = cacheCompile(this.options.body);
      value = Value.Clean(this.options.body, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throw new TypeBoxValidationError(err, compiler);
        throw err;
      }
    }

    if (metadata.type === "query" && this.options.query) {
      const compiler = cacheCompile(this.options.query);
      value = Value.Clean(this.options.query, value);
      value = Value.Convert(this.options.query, value);
      value = Value.Default(this.options.query, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throw new TypeBoxValidationError(err, compiler);
        throw err;
      }
    }

    if (metadata.type === "param" && metadata.data && this.options.params) {
      const schema = this.options.params[metadata.data];
      if (!schema) return value;
      const compiler = cacheCompile(schema);
      if (TypeGuard.IsArray(schema) && typeof value === "string")
        value = value.split(",");
      value = Value.Convert(schema, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throw new TypeBoxValidationError(err, compiler);
        throw err;
      }
    }

    return value;
  }
}
