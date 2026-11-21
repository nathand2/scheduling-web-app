# Session Scheduling App
A Collaborative Session Scheduling Web App where users can invite people to sessions via links to collaboratively plan an activity.

The frontend and API server run as separate services. The API server also hosts
the authenticated Socket.IO endpoint at `/socket/v1` in development and
`/scheduler/socket/v1` in production.

Backend: Node.js, Express.js, Passport.js, JSON Web Tokens, Socket.io

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
5. Start API server: npm run start:dev


## Quickstart Commands from root
cd backend/api | npm run start:dev
cd frontend | npm start

## Tests and CI

- Frontend tests: `cd frontend` then `npm test -- --watchAll=false`
- Backend tests: `cd backend/api` then `npm test`
- MySQL integration tests: set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_DATABASE=scheduler_test`, then run `npm run test:db:setup` followed by `npm run test:integration` from `backend/api`.
- Browser E2E test: `cd frontend` then `npm run e2e` (requires the app and API running against a test database).
- GitHub Actions runs frontend tests/build, backend route tests, MySQL integration tests, and the Cypress E2E flow on pushes and pull requests.

Backend route tests exercise local registration and login behavior with an in-memory database double. The MySQL integration and E2E tests use disposable MySQL 8.0 services in GitHub Actions. The integration tests verify session membership and availability persistence; the browser test covers registration, session creation, invite joining, and availability. Test setup derives the schema from `backend/api/init.sql` but only drops and recreates `scheduler_test` on a local test host; never point it at a shared or production database.
