import { TSchema, TypeGuard } from "@sinclair/typebox";

/**
 * Downgrade schema to OpenAPI 3.0 nullable format.
 *
 * (performs a partial clone on the schema)
 */
export function downgradeSchema<T extends TSchema>(schema: T): T {
  if (TypeGuard.IsArray(schema)) {
    schema = { ...schema, items: downgradeSchema(schema.items) };
  }
  if (TypeGuard.IsObject(schema)) {
    schema = { ...schema, properties: { ...schema.properties } };
    for (const property in schema.properties) {
      schema.properties[property] = downgradeSchema(
        schema.properties[property],
      );
    }
  }
  if (TypeGuard.IsIntersect(schema)) {
    return { ...schema, allOf: schema.allOf.map(downgradeSchema) };
  }
  if (TypeGuard.IsUnion(schema)) {
    if (
      schema.anyOf.length === 2 &&
      schema.anyOf.some((s) => TypeGuard.IsNull(s))
    ) {
      const mainSchema = schema.anyOf.find((s) => !TypeGuard.IsNull(s));
      if (mainSchema) return { ...mainSchema, nullable: true } as unknown as T;
    } else {
      return { ...schema, anyOf: schema.anyOf.map(downgradeSchema) };
    }
  }
  if (TypeGuard.IsLiteralString(schema)) {
    return {
      ...schema,
      type: "string",
      enum: [schema.const],
    };
  }
  return schema;
}
