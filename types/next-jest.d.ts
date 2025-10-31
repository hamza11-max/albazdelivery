declare module 'next/jest' {
  type NextJestOptions = { dir?: string };
  function nextJest(opts?: NextJestOptions): (config: any) => any;
  export default nextJest;
}
