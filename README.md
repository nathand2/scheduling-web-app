# Session Scheduling App
A Collaborative Session Scheduling Web App where users can invite people to sessions via links to collaboratively plan an activity.

The frontend and API server run as separate services. The API server also hosts
the authenticated Socket.IO endpoint at `/socket/v1` in development and
`/scheduler/socket/v1` in production.

Backend: Node.js, TypeScript, Express.js, Passport.js, JSON Web Tokens, Socket.io

Frontend: React.js, React Bootstrap, D3


# Quickstart:

## Frontend
1. Go into frontend directory: cd frontend
2. Install packages with npm: npm install
3. Start React dev server: npm start

## Backend (API)
1. Go into backend directory: cd backend/api
2. Install packages with npm: npm install
3. include .env file in ./backend/api directory
   1. Format:
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    ACCESS_TOKEN_SECRET=
    REFRESH_TOKEN_SECRET=
    DB_DATABASE=
    DB_USER=
    DB_HOST=
    NODE_ENV=development
4. Connect to Database (ssh)
5. Start API server in development: npm run start:dev
   - For a production build, run `npm run build` then `npm start`.


## Quickstart Commands from root
cd backend/api | npm run start:dev
cd frontend | npm start

## Tests and CI

- Frontend tests: `cd frontend` then `npm test -- --watchAll=false`
- Backend tests: `cd backend/api` then `npm test`
- MySQL integration tests: set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_DATABASE=scheduler_test`, then run `npm run test:db:setup` followed by `npm run test:integration` from `backend/api`.
- Browser E2E test: `cd frontend` then `npm run e2e` (requires the app and API running against a test database).
- GitHub Actions runs frontend tests/build, backend route tests, MySQL integration tests, and the Cypress E2E flow on pushes and pull requests.

### Run the E2E test locally on Windows

This requires Docker Desktop. It uses a disposable MySQL container on port `3307`; it never uses DigitalOcean.

1. From the repository root, start the test database: `docker compose -f compose.e2e.yml up -d --wait`.
2. In a backend terminal, set the test database environment and initialize the schema:

   ```powershell
   cd backend/api
   $env:DB_HOST = "127.0.0.1"
   $env:DB_PORT = "3307"
   $env:DB_USER = "root"
   $env:DB_PASSWORD = "test"
   $env:DB_DATABASE = "scheduler_test"
   npm run test:db:setup
   $env:NODE_ENV = "development"
   $env:PORT = "6500"
   $env:ACCESS_TOKEN_SECRET = "local-e2e-access-secret"
   $env:REFRESH_TOKEN_SECRET = "local-e2e-refresh-secret"
   $env:GOOGLE_CLIENT_ID = "e2e-client-id"
   $env:GOOGLE_CLIENT_SECRET = "e2e-client-secret"
   npm run start:dev
   ```

3. In a frontend terminal, run `cd frontend`, `$env:BROWSER = "none"`, then `npm start`.
4. In another frontend terminal, run `cd frontend` then `npm run e2e:open` to watch the test in the Cypress Electron window. Select `scheduling-flow.cy.js` to start it. For a headless run, use `npm run e2e`. If Cypress reports that its binary is missing, run `npx cypress install` once and retry.
5. Stop both servers with Ctrl+C. From the repository root, stop and remove the disposable database with `docker compose -f compose.e2e.yml down`.

The `scheduler_test` setup guard only allows local hosts and the exact test database name. Do not change those settings to point at a shared or production database.

Backend route tests exercise local registration and login behavior with an in-memory database double. The MySQL integration and E2E tests use disposable MySQL 8.0 services in GitHub Actions. The integration tests verify session membership and availability persistence; the browser test covers registration, session creation, invite joining, and availability. Test setup derives the schema from `backend/api/init.sql` but only drops and recreates `scheduler_test` on a local test host; never point it at a shared or production database.
