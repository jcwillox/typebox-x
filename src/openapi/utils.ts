import { TObject, TSchema } from "@sinclair/typebox";

export function getParamSchema(
  name: string,
  { description, example, examples, ...schema }: TSchema,
  required = false,
) {
  return { name, required, schema, description, example, examples };
}

export function getParamSchemas(obj: TObject) {
  return Object.entries(obj.properties).map(([name, schema]) =>
    getParamSchema(name, schema, obj.required?.includes(name)),
  );
}
