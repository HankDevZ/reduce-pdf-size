export function GET(request: Request) {
  return Response.redirect(new URL("/llms.txt", request.url), 308);
}
