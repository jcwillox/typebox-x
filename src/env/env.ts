import type { StaticDecode, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { MergedValueError, mergeErrors } from "../tools";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";

const formatError = (e: MergedValueError) =>
  `  - ${GREEN}${e.path.slice(1)}${RESET}: ${YELLOW}${e.value}${RESET}, ${CYAN}` +
  `${e.errors.map((x) => x.message).join(`${RESET}, ${CYAN}`)}${RESET}`;

/**
 * Create an object from environment variables.
 *
 * Function will clean, convert, default and decode the environment variables.
 *
 * Pulls the values from `process.env` by default.
 *
 * @example
 * const env = createEnv(
 *   t.Object({
 *     APP_ENV: t.Optional(t.String()),
 *     NODE_ENV: t.String({ default: "development" }),
 *     BOOL_FLAG: t.Boolean(),
 *   }),
 * );
 */
export function createEnv<T extends TSchema>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): StaticDecode<T> {
  let value = Value.Clean(schema, { ...env });
  value = Value.Convert(schema, value);
  value = Value.Default(schema, value);
  try {
    return Value.Decode(schema, value);
  } catch (err) {
    console.error(
      `${RED}Configuration is not valid:${RESET}\n` +
        mergeErrors(Value.Errors(schema, value))
          .map((x) => formatError(x))
          .join("\n") +
        "\n",
    );
    throw err;
  }
}
