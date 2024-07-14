import { UseInterceptors, UsePipes, applyDecorators } from "@nestjs/common";
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
};

export function TypeBox(schema: TypeBoxOptions) {
  const decorators: MethodDecorator[] = [];
  if (schema.summary || schema.description) {
    decorators.push(
      ApiOperation({
        summary: schema.summary,
        description: schema.description,
      }),
    );
  }
  if (schema.query || schema.body || schema.params) {
    decorators.push(UsePipes(new TypeboxPipe(schema)));
  }
  if (schema.query) {
    decorators.push(...getParamSchemas(schema.query).map(ApiQuery));
  }
  if (schema.body) {
    decorators.push(ApiBody({ schema: schema.body }));
  }
  if (schema.response) {
    decorators.push(
      UseInterceptors(new TypeBoxInterceptor(schema)),
      ApiResponse({ schema: schema.response }),
    );
  }
  if (schema.params) {
    for (const key in schema.params) {
      decorators.push(ApiParam(getParamSchema(key, schema.params[key], true)));
    }
  }
  return applyDecorators(...decorators);
}
