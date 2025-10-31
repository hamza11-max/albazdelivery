// Minimal jest ambient declarations to satisfy editor when @types/jest isn't installed.
declare namespace jest {
  interface Matchers<R> {}
  interface Expect {
    (actual: any): Matchers<any>;
  }
}

declare var describe: (name: string, fn: () => void) => void;
declare var it: (name: string, fn: () => void) => void;
declare var test: (name: string, fn: () => void) => void;
declare var expect: jest.Expect;

export {};
