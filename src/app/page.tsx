/**
 * Homepage — Server Component shell.
 * All interactive logic (theme reads, settings, dynamic imports) is in HomePageClient.
 * This allows Next.js to SSR the route and reduces TTFB + LCP on initial load.
 */
import HomePageClient from "@/components/sections/HomePageClient";

export default function HomePage() {
  return <HomePageClient />;
}

