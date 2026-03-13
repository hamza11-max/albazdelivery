# APIs connected between Driver app and Customer app

Both apps share the same **database** (Prisma) and operate on the same **orders** and **driver location** data. Below is how their APIs connect.

---

## 1. Shared data and how each app uses it

| Data / API | Customer app | Driver app | Connection |
|------------|--------------|------------|------------|
| **Orders** | `POST /api/orders` (create), `GET /api/orders` (own list), `GET /api/orders/[id]` (detail), `PATCH /api/orders/[id]` (e.g. cancel) | `GET /api/drivers/deliveries` (available = READY unassigned, or assigned to driver), `POST` to accept, `PATCH /api/drivers/deliveries/[id]/status` (IN_DELIVERY, DELIVERED) | Same **Order** table. Customer creates and views their orders; driver sees the same orders as “deliveries” (filtered by status/driverId) and updates status. |
| **Driver location** | `GET /api/orders/track?orderId=...` (order + driver + current location + history) or SSE `/api/sse/driver-location?orderId=...` (web). Expo: only order status via `GET /api/orders/[id]`. | `POST /api/driver/location` (driver sends position); driver app does not read this API | Same **DriverLocation** (and **LocationHistory**) tables. Driver writes location; customer (web) reads it via track/SSE for live map. |
| **Order status** | Customer sees status in order detail/tracking; can cancel via `PATCH /api/orders/[id]`. | Driver moves order through IN_DELIVERY → DELIVERED via `PATCH /api/drivers/deliveries/[id]/status`. | Same **Order.status** and **Order.driverId**. Driver acceptance and status updates are what the customer sees in tracking. |

---

## 2. API paths by app

### Customer app (web + Expo)

- **Orders:** `GET /api/orders`, `POST /api/orders`, `GET /api/orders/[id]`, `PATCH /api/orders/[id]`
- **Tracking (web):** `GET /api/orders/track?orderId=...` (order + driver + driver location), SSE `/api/sse/driver-location?orderId=...`
- **Tracking (Expo):** `GET /api/orders/[id]` only (order status; no driver location yet)

Customer app does **not** call `/api/drivers/deliveries` or `POST /api/driver/location` in normal flows; it only consumes order and (on web) track/track-related data.

### Driver app

- **Deliveries (orders):** `GET /api/drivers/deliveries?available=true` (READY, unassigned), `GET /api/drivers/deliveries` (driver’s assigned), `POST /api/drivers/deliveries` (accept → sets `order.driverId`), `PATCH /api/drivers/deliveries/[id]/status` (IN_DELIVERY, DELIVERED)
- **Location:** `POST /api/driver/location` (send driver position)
- **Notifications:** `GET /api/notifications/sse?role=driver&userId=...`
- **Vendor:** `GET /api/vendor/profile?vendorId=...` (store/vendor info for delivery)

---

## 3. End-to-end flow (how they connect)

1. **Customer places order**  
   Customer app → `POST /api/orders` → **Order** created (e.g. PENDING → … → READY).

2. **Driver sees and accepts**  
   Driver app → `GET /api/drivers/deliveries?available=true` → sees READY orders → `POST` accept → **Order.driverId** set.

3. **Driver updates status and location**  
   Driver app → `PATCH /api/drivers/deliveries/[id]/status` (IN_DELIVERY, then DELIVERED) and → `POST /api/driver/location` → **Order** and **DriverLocation** / **LocationHistory** updated.

4. **Customer sees status and (on web) live tracking**  
   Customer app → `GET /api/orders/[id]` (status) and, on web, `GET /api/orders/track?orderId=...` and SSE → same **Order** and **DriverLocation** data.

So the **APIs that connect driver and customer** are:

- **Orders:** customer creates and reads; driver lists (as deliveries), accepts, and updates status. Same `Order` table and backend logic (role-based).
- **Driver location:** driver writes via `POST /api/driver/location`; customer (web) reads via `GET /api/orders/track` (and optionally SSE). Same `DriverLocation` (and related) tables.

---

## 4. Summary table

| Connection | Description |
|------------|-------------|
| **Orders** | One **Order** record: customer creates and views; driver sees it as a delivery, accepts it, and updates status. Customer uses `/api/orders/*`; driver uses `/api/drivers/deliveries/*`. |
| **Driver location** | Driver updates position with `POST /api/driver/location`. Customer (web) gets position via `GET /api/orders/track` and SSE. Same DB tables; no customer call to `/api/driver/location`. |
| **Database** | Shared Prisma schema: **Order**, **DriverLocation**, **LocationHistory**, **User**, **Store**, etc. |

There is no overlap in *who calls what*: the customer app never calls driver-only endpoints, and the driver app never calls customer-only endpoints. The link is **shared data**: the same order and driver-location records updated by the driver and read by the customer.
