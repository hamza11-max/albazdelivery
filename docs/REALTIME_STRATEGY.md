# Real-time notifications (strategy)

## Current state

- **In-app:** durable `Notification` rows in Postgres.
- **Low-latency hints:** **SSE** (`/api/notifications/sse`) with client reconnect logic; acceptable for dashboards and light live ops.
- **Polling:** many clients still poll list endpoints — simple but no strict latency SLA.

## Product options (cost vs UX)

| Approach | Pros | Cons |
|---------|------|------|
| **Keep SSE + polling** | Minimal new infra; already wired. | Many connections on peak; not ideal for massive fan-out. |
| **Managed pub/sub** (Ably, Pusher, etc.) | Predictable scale; vendor handles presence/reconnect. | Cost + another provider to secure and monitor. |
| **First-party WebSockets** (Node/edge service) | Full control. | Ops burden: sticky sessions, auth, horizontal scale. |

## Recommendation

1. **Short term:** document SSE limits (see `docs/NOTIFICATION_CHANNELS.md`); keep polling caps via rate limits.
2. **Medium term:** if driver/vendor live maps need sub-second updates at scale, pilot **managed pub/sub** for a narrow channel (e.g. driver assignment) before broad WebSocket investment.
3. **Measure:** connection counts, SSE error rate, and p95 notification latency before committing to a large real-time buildout.
