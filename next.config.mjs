/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que Next.js confunda el lockfile de /Users/.../VS/package-lock.json
  // (un package.json ancestro solo para posthog-js) como la raíz del workspace.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
