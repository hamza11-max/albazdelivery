// Plain values shared by main and renderer. No imports: safe to bundle into the UI
// (src/shared/ipc.ts imports zod, so the renderer may only import types from it).

export const LABEL_LAYOUTS = ['roll-50x30', 'roll-40x25', 'a4-3x8', 'a4-5x13'] as const
export type LabelLayout = (typeof LABEL_LAYOUTS)[number]
