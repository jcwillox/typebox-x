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
import type { TObject, TSchema } from "@sinclair/typebox";
import { getParamSchema, getParamSchemas } from "../openapi";
import { TypeBoxInterceptor } from "./interceptors.ts";
import { TypeboxPipe } from "./pipes.ts";

export type TypeBoxOptions = {
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
   * Path params will be cleaned, validated and decoded.
   */
  params?: Record<string, TSchema>;
  /**
   * Define which schemas are required.
   *
   * In development errors will be thrown during validation if a property is used but missing
   * a corresponding schema. In production the property will be set to an empty object.
   *
   * E.g. a get request missing a `query` schema will throw an error if it receives
   * a non-empty query params object.
   *
   * By default, only param schemas are optional.
   */
  requiredSchemas?: {
    /** @default true */
    query?: boolean;
    /** @default true */
    body?: boolean;
    /** @default true */
    response?: boolean;
    /** @default false */
    params?: boolean;
  };
};

const getTypeBoxDecorators = (status: number, options?: TypeBoxOptions) => {
  if (!options) return [];
  const decorators: MethodDecorator[] = [];
  if (options.summary || options.description) {
    decorators.push(
      ApiOperation({
        summary: options.summary,
        description: options.description,
      }),
    );
  }
  if (options.query || options.body || options.params) {
    decorators.push(UsePipes(new TypeboxPipe(options)));
  }
  if (options.query) {
    decorators.push(...getParamSchemas(options.query).map(ApiQuery));
  }
  if (options.body) {
    decorators.push(ApiBody({ schema: options.body }));
  }
  if (options.response) {
    decorators.push(
      UseInterceptors(new TypeBoxInterceptor(options)),
      ApiResponse({ schema: options.response, status }),
    );
  }
  if (options.params) {
    for (const key in options.params) {
      decorators.push(ApiParam(getParamSchema(key, options.params[key], true)));
    }
  }
  return decorators;
};

const createTypeBoxMethod =
  (method: (path?: string | string[]) => MethodDecorator, status: number) =>
  (
    pathOrOptions?: string | string[] | TypeBoxOptions,
    options?: TypeBoxOptions,
  ): MethodDecorator => {
    const isFirstPath =
      typeof pathOrOptions === "string" || Array.isArray(pathOrOptions);
    const path = isFirstPath ? pathOrOptions : undefined;
    const opts = isFirstPath ? options : pathOrOptions;
    return applyDecorators(method(path), ...getTypeBoxDecorators(status, opts));
  };

export const TypeBoxPost = createTypeBoxMethod(NestPost, 201);
export const TypeBoxGet = createTypeBoxMethod(NestGet, 200);
export const TypeBoxDelete = createTypeBoxMethod(NestDelete, 204);
export const TypeBoxPut = createTypeBoxMethod(NestPut, 200);
export const TypeBoxPatch = createTypeBoxMethod(NestPatch, 200);
export const TypeBoxOptions = createTypeBoxMethod(NestOptions, 200);
export const TypeBoxHead = createTypeBoxMethod(NestHead, 200);
export const TypeBoxAll = createTypeBoxMethod(NestAll, 200);
export const TypeBoxSearch = createTypeBoxMethod(NestSearch, 200);

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
