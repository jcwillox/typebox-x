import { TSchema, TypeGuard } from "@sinclair/typebox";

/**
 * Downgrade schema to OpenAPI 3.0 nullable format.
 *
 * (performs a partial clone on the schema)
 */
export function downgradeSchema<T extends TSchema>(schema: T): T {
  /* perform downgrades */
  // downgrade nullable unions
  if (TypeGuard.IsUnion(schema) && schema.anyOf.length === 2) {
    const firstNull = TypeGuard.IsNull(schema.anyOf[0]);
    const secondNull = TypeGuard.IsNull(schema.anyOf[1]);
    if (firstNull || secondNull) {
      return firstNull
        ? ({ ...schema.anyOf[1], nullable: true } as unknown as T)
        : ({ ...schema.anyOf[0], nullable: true } as unknown as T);
    }
  }

  // downgrade literals
  if (TypeGuard.IsLiteral(schema) && !(schema.enum && schema.type)) {
    switch (typeof schema.const) {
      case "boolean":
        return { ...schema, type: "boolean", enum: [schema.const] };
      case "number":
        return { ...schema, type: "number", enum: [schema.const] };
      case "string":
        return { ...schema, type: "string", enum: [schema.const] };
      default:
        return schema;
    }
  }

  /* recurse on nested properties */
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
    return { ...schema, anyOf: schema.anyOf.map(downgradeSchema) };
  }

  return schema;
}
