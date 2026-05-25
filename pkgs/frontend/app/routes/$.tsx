// Catchall splat route. Any URL that doesn't match a more specific route in
// `app/routes/` lands here and throws a 404 Response, which the root
// `ErrorBoundary` renders as `NotFoundScreen`.
export async function loader() {
  throw new Response("Not Found", { status: 404 });
}

// React Router requires a default export for routes. The loader always throws,
// so this never renders — but the framework's type checker still wants it.
export default function CatchAll() {
  return null;
}
