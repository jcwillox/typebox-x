import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { TypeGuard } from "@sinclair/typebox";
import { TransformDecodeCheckError, Value } from "@sinclair/typebox/value";
import { cacheCompile } from "../tools";
import type { TypeBoxOpts } from "./decorators.ts";
import { throwMissingSchemaError, throwValidationError } from "./errors.ts";

const isEmpty = (value: unknown) => {
  if (!value) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

@Injectable()
export class TypeboxPipe implements PipeTransform {
  constructor(private readonly options: TypeBoxOpts) {}
  transform(value: unknown, metadata: ArgumentMetadata) {
    const required = this.options.required;

    if (metadata.type === "body" && !this.options.body && required?.body)
      if (!isEmpty(value))
        throwMissingSchemaError(metadata.type, metadata.data, this.options);

    if (metadata.type === "body" && this.options.body) {
      const compiler = cacheCompile(this.options.body);
      value = Value.Clean(this.options.body, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throwValidationError(err, compiler, this.options.errorFactory);
        else throw err;
      }
    }

    if (metadata.type === "query" && !this.options.query && required?.query)
      if (!isEmpty(value))
        throwMissingSchemaError(metadata.type, metadata.data, this.options);

    if (metadata.type === "query" && this.options.query) {
      const compiler = cacheCompile(this.options.query);
      value = Value.Clean(this.options.query, value);
      value = Value.Convert(this.options.query, value);
      value = Value.Default(this.options.query, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throwValidationError(err, compiler, this.options.errorFactory);
        else throw err;
      }
    }

    if (metadata.type === "param" && metadata.data && this.options.params) {
      const schema = this.options.params[metadata.data];
      if (!schema) {
        if (required?.params)
          throwMissingSchemaError(metadata.type, metadata.data, this.options);
        return value;
      }
      const compiler = cacheCompile(schema);
      if (TypeGuard.IsArray(schema) && typeof value === "string")
        value = value.split(",");
      value = Value.Convert(schema, value);
      try {
        return compiler.Decode(value);
      } catch (err) {
        if (err instanceof TransformDecodeCheckError)
          throwValidationError(err, compiler, this.options.errorFactory);
        else throw err;
      }
    }

    return value;
  }
}
