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
import {
  TIntersect,
  TObject,
  TSchema,
  Type,
  TypeGuard,
} from "@sinclair/typebox";
import { downgradeSchema, getParamSchema, getParamSchemas } from "../openapi";
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
   * Query will be cleaned, validated and decoded.
   *
   * Top-level intersection schemas will be converted to composite schemas.
   */
  query?: TObject | TIntersect;
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
   * Path params will be validated and decoded.
   */
  params?: Record<string, TSchema>;
  /**
   * Simplify nullable schemas for anyOf unions to using the `nullable` keyword.
   * Add `enum` to literal `const` string schemas.
   *
   * This is only done on the schema provided to the openapi docs, not the actual validation schema.
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
   * Define which intersection schemas should be converted to composite schemas.
   *
   * Only top-level intersections are converted, nested intersections are left as is.
   */
  mergeIntersection?: {
    body?: boolean;
    response?: boolean;
  };
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
};

const getTypeBoxDecorators = (status: number, options?: TypeBoxOpts) => {
  if (!options) return [];
  options.downgradeSchema ??= true;
  const decorators: MethodDecorator[] = [];

  // merge intersection schemas
  if (TypeGuard.IsIntersect(options.query)) {
    const { allOf, ...rest } = options.query;
    options.query = Type.Composite(allOf, rest);
  }
  if (options.mergeIntersection?.body)
    if (TypeGuard.IsIntersect(options.body)) {
      const { allOf, ...rest } = options.body;
      options.body = Type.Composite(allOf, rest);
    }
  if (options.mergeIntersection?.response)
    if (TypeGuard.IsIntersect(options.response)) {
      const { allOf, ...rest } = options.response;
      options.response = Type.Composite(allOf, rest);
    }

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
    const schema = options.downgradeSchema
      ? downgradeSchema(options.query)
      : options.query;
    decorators.push(...getParamSchemas(schema).map(ApiQuery));
  }

  // add body schema
  if (options.body) {
    const schema = options.downgradeSchema
      ? downgradeSchema(options.body)
      : options.body;
    decorators.push(ApiBody({ schema }));
  }

  // add response schema
  if (options.response) {
    const schema = options.downgradeSchema
      ? downgradeSchema(options.response)
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
      const schema = options.downgradeSchema
        ? downgradeSchema(options.params[key])
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
