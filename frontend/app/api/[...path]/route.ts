import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

function getBackendBaseUrl() {
  return (process.env.BACKEND_INTERNAL_URL ?? "http://backend:3001").replace(/\/+$/, "");
}

function buildTargetUrl(pathSegments: string[], request: NextRequest) {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${getBackendBaseUrl()}/api/${pathSegments.join("/")}`);

  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

function filterHeaders(headers: Headers) {
  const nextHeaders = new Headers();

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      nextHeaders.set(key, value);
    }
  });

  return nextHeaders;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const targetUrl = buildTargetUrl(pathSegments, request);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const response = await fetch(targetUrl, {
    method,
    headers: filterHeaders(request.headers),
    body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: filterHeaders(response.headers),
  });
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
