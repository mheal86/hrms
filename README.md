# HRMS – Human Resource Management System

A full-stack web application for HR staff to manage employees and departments, with role-based access
control and a complete audit trail of every change.

Built as my individual project during a software engineering internship (Jul – Aug 2026), with code
reviews from a mentor.

## Features

- **Employees** – searchable, sortable, paginated list; profile with contact details, personal details and
  department history; status toggle; **Excel import with data validation**.
- **Departments** – headcount, gender and age breakdown, position distribution, transfer employees between
  departments (each transfer is kept in the department history).
- **Dashboard** – department distribution chart, headcount, month-over-month staffing trend, recent hires.
- **Role-based access control** – `ADMIN` and `USER` roles; protected API routes and guarded pages.
- **Audit log** – every create, update, status change and transfer is recorded with who, when and a
  **field-level before/after diff**, viewable in the UI.
- **Security** – JWT authentication, bcrypt password hashing, password strength rules.
- **i18n and theming** – English / Vietnamese, light and dark theme.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 21, PrimeNG 21, ngx-formly, Chart.js, ngx-translate, SCSS |
| Backend | Node.js, Express 5, Mongoose 9, JWT, bcryptjs, multer (avatar upload), xlsx |
| Database | MongoDB (local or MongoDB Atlas) |
| Tests | Vitest (frontend unit tests) |

## Project structure

```
hrms-backend/    Express API: config, models, controllers, routes, middleware (auth, RBAC, audit)
hrms-frontend/   Angular app: core (services, guards), features (employee, department, dashboard,
                 audit-log, auth, profile), shared components, layout
```

Main data models: `User`, `Role`, `Employee`, `Department`, `DepartmentHistory`, `AuditLog`.

## Run locally

Requirements: Node.js 20+ and a MongoDB database (local MongoDB or a free MongoDB Atlas cluster).

**Backend**

```bash
cd hrms-backend
npm install
# create hrms-backend/environment/.env from the example and fill in your own values
mkdir environment
cp .env.example environment/.env
node seed.js        # creates roles and a local admin account (printed in the console)
npm run dev         # API on the PORT set in .env
```

**Frontend**

```bash
cd hrms-frontend
npm install
npm start           # http://localhost:4200
npm test            # unit tests
```

## Notes

- Secrets live only in `hrms-backend/environment/.env`, which is git-ignored. Never commit real
  credentials; use `.env.example` as the template.
- The seed account is for local development only.
