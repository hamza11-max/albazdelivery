# AL-baz Delivery Platform

A comprehensive multi-vendor delivery platform for Algeria featuring food delivery, groceries, beauty products, gifts, and package delivery services.

## 🏗️ Monorepo Structure

This project uses a **Turborepo monorepo** architecture with separate apps for different user roles:

```
albazdelivery/
├── apps/
│   ├── customer/    # Customer-facing app (Port 3000)
│   ├── vendor/      # Vendor dashboard app (Port 3001)
│   ├── driver/      # Driver app (Port 3002)
│   └── admin/       # Admin panel app (Port 3003)
├── packages/
│   ├── ui/          # Shared UI component library
│   ├── shared/      # Shared utilities and types
│   └── auth/        # Authentication package
├── lib/             # Shared libraries (Prisma, utilities)
├── components/      # Shared React components
└── hooks/           # Shared React hooks
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database

### Installation

```bash
# Install all dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Or run individual apps
cd apps/customer && npm run dev  # http://localhost:3000
cd apps/vendor && npm run dev    # http://localhost:3001
cd apps/driver && npm run dev    # http://localhost:3002
cd apps/admin && npm run dev     # http://localhost:3003
```

### Building

```bash
# Build all apps
npm run build

# Build specific app
cd apps/customer && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific app
cd apps/customer && npm test
```

## 📦 Apps

### Customer App (`apps/customer`)
- **Port**: 3000
- **Purpose**: Customer-facing web application
- **Features**: Browse products, place orders, track deliveries

### Vendor App (`apps/vendor`)
- **Port**: 3001
- **Purpose**: Vendor dashboard and management
- **Features**: Inventory management, order processing, analytics

### Driver App (`apps/driver`)
- **Port**: 3002
- **Purpose**: Driver delivery management
- **Features**: Accept deliveries, track routes, update status

### Admin App (`apps/admin`)
- **Port**: 3003
- **Purpose**: Platform administration
- **Features**: User management, order oversight, analytics

## 📚 Shared Packages

### `@albaz/ui`
Shared UI component library with reusable React components.

### `@albaz/shared`
Shared utilities, types, and helper functions.

### `@albaz/auth`
Authentication and authorization utilities.

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm test` - Run all tests
- `npm run lint` - Lint all apps
- `npm run type-check` - Type-check all apps

### App Level
Each app has its own scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - Type-check TypeScript

## 🗄️ Database

The project uses Prisma ORM with PostgreSQL. All apps share the same database.

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Migration Notes (Prisma 7)

- `npm run db:migrate:dev` uses a **shadow database** and may fail if your provider cannot create/drop one.
- If needed, set `SHADOW_DATABASE_URL` (different DB from `DATABASE_URL`) in `.env.local`.
- For deployment/CI, prefer:

```bash
npm run db:migrate
```

If `migrate deploy` is blocked by a previously failed migration (`P3009` / `P3018`), recover with:

```bash
# mark broken migration state appropriately
npx prisma migrate resolve --rolled-back <migration_name>
# or
npx prisma migrate resolve --applied <migration_name>

# then apply pending migrations
npm run db:migrate
```

## 🌐 Custom Domains

Vendor/store custom domains are supported with subscription-based limits and DNS verification.

- Vendor-level domains (`User` with role `VENDOR`)
- Store-level override domains (`Store`)
- Verification flow with TXT/CNAME checks
- Plan-aware enforcement (`STARTER`/`PROFESSIONAL`/`BUSINESS`/`ENTERPRISE`)

See:

- [Custom Domains Guide](./docs/CUSTOM_DOMAINS_README.md)

## 🧪 Testing

Tests are located in the root `__tests__` directory and can be run from any app:

```bash
# From root
npm test

# From specific app
cd apps/customer && npm test
```

## 📝 Environment Variables

Environment variables are configured at both root and app levels. See the [Environment Setup Guide](./ENV_SETUP_GUIDE.md) for detailed instructions.

### Quick Setup

1. **Root level** (shared):
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **App level** (optional, app-specific overrides):
   ```bash
   cp apps/customer/.env.example apps/customer/.env.local
   cp apps/vendor/.env.example apps/vendor/.env.local
   cp apps/driver/.env.example apps/driver/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth secret key (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application base URL

### Optional Variables

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For OAuth login
- `REDIS_URL` / `REDIS_TOKEN` - For caching and rate limiting
- `ALLOWED_ORIGINS` - CORS configuration

See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for complete documentation.

## 🚢 Deployment

Each app can be deployed independently:

- **Customer**: Deploy to `app.albazdelivery.com`
- **Vendor**: Deploy to `vendor.albazdelivery.com`
- **Driver**: Deploy to `driver.albazdelivery.com`
- **Admin**: Deploy to `admin.albazdelivery.com`

See [MONOREPO_NEXT_STEPS.md](./MONOREPO_NEXT_STEPS.md) for detailed deployment instructions.

## 📖 Documentation

- [Environment Setup Guide](./ENV_SETUP_GUIDE.md) - **Start here!** Configure environment variables
- [Monorepo Next Steps](./MONOREPO_NEXT_STEPS.md) - What to do next
- [Architecture Proposal](./ARCHITECTURE_PROPOSAL.md) - System architecture
- [API Documentation](./API_DOCUMENTATION.md) - API endpoints
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [Custom Domains Guide](./docs/CUSTOM_DOMAINS_README.md) - Vendor/store domain setup, DNS verify, plan limits

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Build to verify: `npm run build`
5. Submit a pull request

## 📄 License

[Add your license here]

## 🔗 Links

- [Customer App](http://localhost:3000) (dev)
- [Vendor App](http://localhost:3001) (dev)
- [Driver App](http://localhost:3002) (dev)
- [Admin App](http://localhost:3003) (dev)

---

**Built with**: Next.js, React, TypeScript, Prisma, Turborepo
