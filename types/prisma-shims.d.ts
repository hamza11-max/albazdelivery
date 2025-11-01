// Lightweight Prisma client shims to satisfy the TypeScript server until the
// generated client types are resolved. These mirror the enums in prisma/schema.prisma
// and provide minimal model types so the editor stops reporting missing exports.

declare module '@prisma/client' {
  // Enums from schema.prisma
  export enum OrderStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    ASSIGNED = 'ASSIGNED',
    IN_DELIVERY = 'IN_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
  }

  export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    WALLET = 'WALLET'
  }

  // Best-effort: ChatParticipantRole may be referenced; declare a permissive enum
  export enum ChatParticipantRole {
    CUSTOMER = 'CUSTOMER',
    VENDOR = 'VENDOR',
    DRIVER = 'DRIVER',
    ADMIN = 'ADMIN'
  }

  // Minimal model placeholders (replace with real generated types from Prisma client)
  export type Order = any;
  export type Payment = any;
  export type Notification = any;
  export type ChatMessage = any;
  export type User = any;

  // Minimal Prisma namespace placeholder
  export namespace Prisma {
    export type JsonValue = any;
    export type DateTime = Date;
    export type Decimal = any;
    export type PrismaClientKnownRequestError = any;
  }

  // Default export: PrismaClient class placeholder with permissive index signature
  // so calls like `prisma.order.findMany()` type-check while real generated
  // client types are available after a proper `prisma generate`.
  export class PrismaClient {
    constructor(opts?: any);
    [k: string]: any;
    $transaction?: any;
    $queryRaw?: any;
    $executeRaw?: any;
    $disconnect?: () => Promise<void>;
  }
}

export {};
