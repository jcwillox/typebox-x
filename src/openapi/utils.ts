import { KindGuard, TObject, TSchema } from "@sinclair/typebox";

type TParamSchema = {
  name: string;
  required: boolean;
  schema: Omit<TSchema, "description" | "examples" | "example">;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  example?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples?: any;
};

/** Creates a parameter schema for OpenAPI from a JSON schema */
export function getParamSchema(
  name: string,
  { description, example, examples, ...schema }: TSchema,
  required = false,
): TParamSchema {
  return { name, required, schema, description, example, examples };
}

/** Creates an array of parameter schemas for OpenAPI from a JSON schema */
export function getParamSchemas(obj: TObject) {
  return Object.entries(obj.properties).map(([name, schema]) =>
    getParamSchema(name, schema, obj.required?.includes(name)),
  );
}

/** Check if the schema has an `id` property. */
export function hasSchemaId(schema: TSchema): boolean {
  if (schema.$id) return true;
  if (KindGuard.IsArray(schema)) {
    return hasSchemaId(schema.items);
  } else if (KindGuard.IsObject(schema)) {
    for (const property in schema.properties) {
      if (hasSchemaId(schema.properties[property])) {
        return true;
      }
    }
  } else if (KindGuard.IsIntersect(schema)) {
    for (const schema_ of schema.allOf) {
      if (hasSchemaId(schema_)) {
        return true;
      }
    }
  } else if (KindGuard.IsUnion(schema)) {
    for (const schema_ of schema.anyOf) {
      if (hasSchemaId(schema_)) {
        return true;
      }
    }
  }
  return false;
}
