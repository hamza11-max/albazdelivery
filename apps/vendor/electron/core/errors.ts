/** An error whose code and message are safe to show in the UI (see toResult in ipc.ts). */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
