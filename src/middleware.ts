import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Publieke routes die zonder login toegankelijk zijn. */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Alles behalve Next-internals en statische bestanden, tenzij in query.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Altijd voor API-routes.
    "/(api|trpc)(.*)",
  ],
};
