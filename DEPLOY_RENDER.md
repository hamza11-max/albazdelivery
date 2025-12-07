Deploying to Render

1. Create a Web Service on Render:
   - Go to Render.com → New → Web Service.
   - Connect your GitHub repo (hamza11-max/albazdelivery).
   - Choose branch: `main`.

2. Build & Start commands:
   - Build command:

     pnpm install && pnpm build && npx prisma migrate deploy

     (If you prefer not to run migrations during build, remove the last `&& npx prisma migrate deploy` and run migrations separately.)

   - Start command:

     pnpm start

3. Environment variables (set these in Render → Service → Environment):
   - NEXTAUTH_URL = https://<your-service>.onrender.com
   - NEXTAUTH_SECRET = <secure 32+ char string>  (generate locally: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
   - DATABASE_URL = postgresql://user:pass@host:5432/dbname?sslmode=require
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)
   - NODE_ENV = production
   - NEXT_TELEMETRY_DISABLED = 1

4. Secrets: Use Render's Dashboard to store sensitive values (do not commit them to git).

5. Migrations:
   - If you included `npx prisma migrate deploy` in the build command, ensure the DB is reachable during build.
   - Alternatively, run migrations manually from a one-off instance or CI job using:

     npx prisma migrate deploy --schema=prisma/schema.prisma

6. Health checks & instance settings:
   - Set the health check path to `/` or a small API route.
   - Choose a plan (starter/standard) based on traffic.

7. After deploying:
   - View the service logs on Render (Deploys → Instance → Logs).
   - The auth debug logs we added will print helpful environment info for `/api/auth/*` calls.

8. Troubleshooting Git push 403:
   - If `git push` fails with 403, either:
     a) Switch to SSH remote and push with an SSH key:

        git remote set-url origin git@github.com:hamza11-max/albazdelivery.git
        git push origin HEAD

     b) Use a GitHub Personal Access Token (PAT) with repo permissions when prompted for password (HTTPS).

9. If you want me to push changes for you, you can either:
   - Provide a temporary PAT (not recommended to share here), or
   - Update your local environment to push (SSH key or PAT), then run:

     git push origin HEAD


Security reminder: Never commit secrets to this repository. Use Render's environment/secret UI.
