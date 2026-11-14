# Simple deployment

This setup deploys the Next.js frontend to Vercel and one Node API service to
Render. The API uses PostgreSQL and a small in-process cache. Kafka, Redis,
workers, Nginx, and monitoring are not required.

## 1. Create the database

Create a PostgreSQL database with a provider such as Neon or Render Postgres.
Copy its pooled/runtime connection URL for the API's `DATABASE_URL` setting.
Keep the direct connection URL available if the provider gives separate URLs
for migrations.

## 2. Deploy the API to Render

Create a Render Blueprint from this repository and use the checked-in
`render.yaml`. Set these values when Render prompts for them:

- `DATABASE_URL`: PostgreSQL connection URL (include `sslmode=require` if the
  database provider requires it).
- `CORS_ORIGIN`: the Vercel site origin, for example
  `https://your-project.vercel.app` (no trailing slash). Multiple origins can
  be comma-separated.
- `EMAIL_USER` and `EMAIL_PASS`: Gmail address and an app password. These are
  needed for signup verification and password reset emails. If unset, those
  email flows return an error; product browsing and other API routes still run.

Render generates `JWT_SECRET`. The build runs Prisma migrations before starting
the API. Once deployed, check `https://<render-service>.onrender.com/health`.

## 3. Deploy the frontend to Vercel

Import this repository in Vercel and set **Root Directory** to `frontend`.
Vercel detects Next.js automatically. Add this environment variable before
deploying:

```text
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
```

After the first Vercel deployment, copy the site's origin into Render's
`CORS_ORIGIN`, then redeploy the API. If you use a Vercel preview URL, add that
origin too or test against the production URL.

## Important hosting limits

- This uses a single API instance. Without `REDIS_URL`, cache entries and OTPs
  live in process memory; a restart clears them. Do not scale the API to
  multiple instances without adding shared Redis.
- The API currently writes product uploads to local disk. Render's default
  filesystem is temporary, so uploaded images can disappear after a restart or
  deployment. Use object storage (for example Cloudinary or S3) before relying
  on persistent product image uploads.
- Orders are saved directly in PostgreSQL. Kafka-based order notifications and
  background email workers are not part of this deployment.
