/**
 * The one `json`/`errorResponse` pair for this package.
 *
 * `src/index.ts` and each of `handlers/{issue,list,revoke}.ts` used to
 * define their own byte-identical copy of `errorResponse`, and a `json`
 * that differed only in argument order: `index.ts`'s took `(body, status)`
 * while the handlers took `(status, body)` — a real footgun for anyone
 * copy-pasting a call between an index.ts context and a handler context and
 * getting the arguments silently swapped (both are valid calls; only one is
 * the response you meant). `(status, body)` wins here because three of the
 * four call sites already used it.
 */
export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function errorResponse(
  status: number,
  error: string,
  details?: string,
): Response {
  return json(status, details === undefined ? { error } : { error, details });
}
