// ==============================================
// ORDER STATUS CONSTANTS
// ==============================================
export const OrderStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  ASSIGNED: 'ASSIGNED',
  IN_DELIVERY: 'IN_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export type OrderStatusUpdate = {
  status: OrderStatus;
  driverId?: string;
};

// ==============================================
// BUSINESS CONSTANTS
// ==============================================
/** Default delivery fee in DZD (Algerian Dinar) */
export const DEFAULT_DELIVERY_FEE = 500;

/** Free delivery threshold - orders above this amount get free delivery */
export const FREE_DELIVERY_THRESHOLD = 3000;

/** Maximum delivery fee cap in DZD */
export const MAX_DELIVERY_FEE = 1000;

/** Tax rate (0 = no tax, 0.19 = 19%) */
export const TAX_RATE = 0;

/** Maximum items allowed in a single order */
export const MAX_ORDER_ITEMS = 50;

/** Maximum cart value in DZD */
export const MAX_CART_VALUE = 100000;

/** Minimum order value in DZD */
export const MIN_ORDER_VALUE = 200;

// ==============================================
// LOYALTY & REWARDS
// ==============================================
/** Points earned per DZD spent (5% = 0.05) */
export const LOYALTY_POINTS_RATE = 0.05;

/** Points required for Bronze tier */
export const BRONZE_TIER_POINTS = 0;

/** Points required for Silver tier */
export const SILVER_TIER_POINTS = 1000;

/** Points required for Gold tier */
export const GOLD_TIER_POINTS = 5000;

/** Points required for Platinum tier */
export const PLATINUM_TIER_POINTS = 10000;

/** Referral bonus points */
export const REFERRAL_BONUS_POINTS = 500;

// ==============================================
// DELIVERY & DRIVER CONSTANTS
// ==============================================
/** Maximum distance for delivery in km */
export const MAX_DELIVERY_DISTANCE_KM = 20;

/** Driver location update interval in milliseconds */
export const DRIVER_LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

/** Order auto-assignment timeout in minutes */
export const AUTO_ASSIGNMENT_TIMEOUT_MINUTES = 10;

/** Maximum orders a driver can handle simultaneously */
export const MAX_DRIVER_CONCURRENT_ORDERS = 3;

// ==============================================
// CACHING & PERFORMANCE
// ==============================================
/** Cache TTL for product listings in seconds */
export const CACHE_TTL_PRODUCTS = 300; // 5 minutes

/** Cache TTL for store listings in seconds */
export const CACHE_TTL_STORES = 600; // 10 minutes

/** Cache TTL for user sessions in seconds */
export const CACHE_TTL_SESSION = 3600; // 1 hour

/** SSE reconnection delay in milliseconds */
export const SSE_RECONNECT_DELAY = 3000; // 3 seconds

/** Order status polling interval in milliseconds */
export const ORDER_POLLING_INTERVAL = 5000; // 5 seconds

// ==============================================
// VALIDATION CONSTANTS
// ==============================================
/** Algerian phone number regex pattern */
export const ALGERIAN_PHONE_REGEX = /^(0|\+213)[567]\d{8}$/;

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum username length */
export const MAX_USERNAME_LENGTH = 50;

/** Maximum description length */
export const MAX_DESCRIPTION_LENGTH = 500;

// ==============================================
// PAGINATION DEFAULTS
// ==============================================
/** Default page size for API responses */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size allowed */
export const MAX_PAGE_SIZE = 100;

/** Default page number */
export const DEFAULT_PAGE = 1;

// ==============================================
// IMAGE UPLOAD LIMITS
// ==============================================
/** Maximum file size in bytes (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed image mime types */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum images per product */
export const MAX_IMAGES_PER_PRODUCT = 5;

// ==============================================
// NOTIFICATION SETTINGS
// ==============================================
/** Maximum number of notifications to show */
export const MAX_NOTIFICATIONS = 50;

/** Notification auto-dismiss timeout in milliseconds */
export const NOTIFICATION_TIMEOUT = 5000; // 5 seconds

// ==============================================
// CITIES
// ==============================================
/** Supported Algerian cities */
export const ALGERIAN_CITIES = [
  'Alger',
  'Oran',
  'Constantine',
  'Annaba',
  'Blida',
  'Batna',
  'Djelfa',
  'Sétif',
  'Sidi Bel Abbès',
  'Biskra',
  'Tébessa',
  'El Oued',
  'Skikda',
  'Tiaret',
  'Béjaïa',
  'Tlemcen',
  'Ouargla',
  'Ghardaïa',
  'Tamanrasset',
] as const;

export type AlgerianCity = typeof ALGERIAN_CITIES[number];