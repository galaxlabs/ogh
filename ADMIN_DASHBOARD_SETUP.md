# Admin Dashboard Setup

## Access

Open the admin panel at:

- /admin

Default local development credentials:

- Email: admin@openguidehub.local
- Password: Admin@12345

Change them in the environment before any production deployment.

## Features

- Post management
- Download management
- Console status and recent error logs
- Backup creation
- Restore from backup JSON
- Prisma-ready database configuration

## Database modes

You can switch between:

- PostgreSQL
- MySQL

Environment examples:

- DATABASE_PROVIDER=postgresql
- DATABASE_URL=postgresql://user:password@localhost:5432/ogh_admin

or

- DATABASE_PROVIDER=mysql
- DATABASE_URL=mysql://user:password@localhost:3306/ogh_admin

## Services

- Web frontend: port 3000
- PocketBase CMS: port 8090
- Admin API: port 3100
