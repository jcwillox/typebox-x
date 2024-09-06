import {
  All as NestAll,
  Delete as NestDelete,
  Get as NestGet,
  Head as NestHead,
  Options as NestOptions,
  Patch as NestPatch,
  Post as NestPost,
  Put as NestPut,
  Search as NestSearch,
  UseInterceptors,
  UsePipes,
  applyDecorators,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { TObject, TSchema } from "@sinclair/typebox";
import {
  downgradeSchema,
  getParamSchema,
  getParamSchemas,
  shouldDowngradeSchema,
} from "../openapi";
import { TypeBoxMissingSchemaError, TypeBoxValidationError } from "./errors.ts";
import { TypeBoxInterceptor } from "./interceptors.ts";
import { TypeboxPipe } from "./pipes.ts";

export type TypeBoxOpts = {
  /**
   * Provide a summary for the endpoint.
   */
  summary?: string;
  /**
   * Provide a description for the endpoint.
   */
  description?: string;
  /**
   * Provide a schema for the query.
   *
   * Query will be cleaned, defaulted, converted, validated and decoded.
   */
  query?: TObject;
  /**
   * Provide a schema for the request body.
   *
   * Body will be cleaned, validated and decoded.
   */
  body?: TSchema;
  /**
   * Provide a schema for the response.
   *
   * Response will be cleaned, validated and encoded.
   */
  response?: TSchema;
  /**
   * Provide schemas for path params.
   *
   * You can provide a single schema for all path params or a schema for each path param.
   *
   * Path params will be converted, validated and decoded.
   */
  params?: Record<string, TSchema>;
  /**
   * Downgrade typebox JSON schema to an openapi 3.0 compatible schema, as well as
   * this improves compatibility with most openapi schema renderers.
   *
   * This is only done on the schema provided to the openapi docs, the actual validation schema,
   * is not mutated.
   *
   * This option will be ignored if `transformSchema` is provided.
   *
   * See the `downgradeSchema` function for more information on what transformations are made.
   *
   * @default true
   */
  downgradeSchema?: boolean;
  /**
   * Disable response validation
   *
   * Can improve performance if you are confident in the response schema.
   *
   * @default true
   */
  validateResponse?: boolean;
  /**
   * Define which schemas are required.
   *
   * If a schema is marked as required but missing during validation, it will
   * throw a `TypeBoxMissingSchemaError`.
   *
   * You likely don't want to throw errors in production as users could provide values for schemas that
   * you don't use, and you still want the endpoint to function correctly, even if they provide query
   * params for an endpoint that doesn't use query params. However, in development this is likely an
   * endpoint that is missing a schema.
   *
   * For example a GET request missing a `query` schema will throw an error if it receives a non-empty
   * query params object.
   */
  required?: {
    query?: boolean;
    body?: boolean;
    response?: boolean;
    params?: boolean;
    /**
     * Provide a custom error factory for the required schema errors.
     *
     * Should return an error to be thrown, or a falsy value to ignore the error.
     */
    errorFactory?: (error: TypeBoxMissingSchemaError) => Error | undefined;
  };
  /**
   * Provide a custom error factory for the validation pipe.
   *
   * Should return an error to be thrown, or a falsy value to ignore the error.
   */
  errorFactory?: (error: TypeBoxValidationError<TSchema>) => Error | undefined;
  /**
   * Apply custom transformations to the schema that is provided to the openapi docs.
   *
   * The returned value is only used for the openapi docs, and does not replace the
   * schema used for validation.
   *
   * You can however mutate the schema in place, as it is a reference to the original schema.
   * However, this is not recommended as it can lead to unexpected behaviour.
   *
   * This will override the `downgradeSchema` option, if you want to downgrade the schema
   * you will need to do it manually in this function. E.g.
   *
   * ```ts
   * transformSchema: (type, schema) => downgradeSchema(schema);
   * ```
   */
  transformSchema?: (
    type: "query" | "body" | "response" | "param",
    schema: TSchema,
  ) => TSchema;
};

const downgradeTransformSchema: TypeBoxOpts["transformSchema"] = (_, schema) =>
  shouldDowngradeSchema(schema) ? downgradeSchema(schema) : schema;

const getTypeBoxDecorators = (status: number, options?: TypeBoxOpts) => {
  if (!options) return [];
  if (options.downgradeSchema !== false) {
    options.transformSchema ??= downgradeTransformSchema;
  }
  const decorators: MethodDecorator[] = [];

  // add operation metadata
  if (options.summary || options.description)
    decorators.push(
      ApiOperation({
        summary: options.summary,
        description: options.description,
      }),
    );

  // attach validation pipe
  const required = options.required;
  const isRequired = required?.query || required?.body || required?.params;
  if (isRequired || options.query || options.body || options.params)
    decorators.push(UsePipes(new TypeboxPipe(options)));

  // add query schema
  if (options.query) {
    const schema = options.transformSchema
      ? (options.transformSchema("query", options.query) as TObject)
      : options.query;
    decorators.push(...getParamSchemas(schema).map(ApiQuery));
  }

  // add body schema
  if (options.body) {
    const schema = options.transformSchema
      ? options.transformSchema("body", options.body)
      : options.body;
    decorators.push(ApiBody({ schema }));
  }

  // add response schema
  if (options.response) {
    const schema = options.transformSchema
      ? options.transformSchema("response", options.response)
      : options.response;
    decorators.push(
      UseInterceptors(new TypeBoxInterceptor(options)),
      ApiResponse({ schema, status }),
    );
  } else if (required?.response) {
    decorators.push(UseInterceptors(new TypeBoxInterceptor(options)));
  }

  // add param schemas
  if (options.params) {
    for (const key in options.params) {
      const schema = options.transformSchema
        ? options.transformSchema("param", options.params[key])
        : options.params[key];
      decorators.push(ApiParam(getParamSchema(key, schema, true)));
    }
  }

  return decorators;
};

const createRequestMethod =
  (
    method: (path?: string | string[]) => MethodDecorator,
    status: number,
    defaults?: TypeBoxOpts,
  ) =>
  (
    pathOrOptions?: string | string[] | TypeBoxOpts,
    options?: TypeBoxOpts,
  ): MethodDecorator => {
    const hasPath =
      typeof pathOrOptions === "string" || Array.isArray(pathOrOptions);
    return applyDecorators(
      method(hasPath ? pathOrOptions : undefined),
      ...getTypeBoxDecorators(status, {
        ...defaults,
        ...(hasPath ? options : pathOrOptions),
      }),
    );
  };

export const createRequestMethods = (defaultOptions?: TypeBoxOpts) => ({
  Post: createRequestMethod(NestPost, 201, defaultOptions),
  Get: createRequestMethod(NestGet, 200, defaultOptions),
  Delete: createRequestMethod(NestDelete, 200, defaultOptions),
  Put: createRequestMethod(NestPut, 200, defaultOptions),
  Patch: createRequestMethod(NestPatch, 200, defaultOptions),
  Options: createRequestMethod(NestOptions, 200, defaultOptions),
  Head: createRequestMethod(NestHead, 200, defaultOptions),
  All: createRequestMethod(NestAll, 200, defaultOptions),
  Search: createRequestMethod(NestSearch, 200, defaultOptions),
});

export const TypeBoxPost = createRequestMethod(NestPost, 201);
export const TypeBoxGet = createRequestMethod(NestGet, 200);
export const TypeBoxDelete = createRequestMethod(NestDelete, 200);
export const TypeBoxPut = createRequestMethod(NestPut, 200);
export const TypeBoxPatch = createRequestMethod(NestPatch, 200);
export const TypeBoxOptions = createRequestMethod(NestOptions, 200);
export const TypeBoxHead = createRequestMethod(NestHead, 200);
export const TypeBoxAll = createRequestMethod(NestAll, 200);
export const TypeBoxSearch = createRequestMethod(NestSearch, 200);

export {
  TypeBoxPost as Post,
  TypeBoxGet as Get,
  TypeBoxDelete as Delete,
  TypeBoxPut as Put,
  TypeBoxPatch as Patch,
  TypeBoxOptions as Options,
  TypeBoxHead as Head,
  TypeBoxAll as All,
  TypeBoxSearch as Search,
};
