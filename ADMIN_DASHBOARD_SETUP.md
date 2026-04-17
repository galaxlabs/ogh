# Internal Operations Setup

Internal access details are intentionally not exposed in public documentation.

Configure administrator credentials only through local or server environment variables before deployment.

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
