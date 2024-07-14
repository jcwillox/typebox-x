import type { TSchema } from "@sinclair/typebox";
import { TypeCheck, TypeCompiler } from "@sinclair/typebox/compiler";

const compilerCache = new Map<TSchema, unknown>();

export function cacheCompile<T extends TSchema>(
  schema: T,
  references?: TSchema[],
): TypeCheck<T> {
  if (compilerCache.has(schema)) {
    // we can safely cast here because we know the type is correct
    return compilerCache.get(schema) as TypeCheck<T>;
  }
  const compiler = TypeCompiler.Compile(schema, references);
  compilerCache.set(schema, compiler);
  return compiler;
}
