# Session Scheduling App


Backend: Node.js, Express, Passport, JWT

Frontend: React.js, SASS

Prerequisites: XAMPP (Local MySQL), NPM

# Quickstart:

## Backend
1. Go into backend directory: cd backend
2. Install packages with npm: npm install
3. include .env file in ./backend directory
4. Start XAMPP software.
   1. Start Apache and MySQL modules.
   2. Open MySQL Admin (opens up browser to PHPMyAdmin)
   3. Create database with name "scheduler": CREATE DATABASE scheduler;
   4. Manually add needed tables. Check init.sql for table references. Currently used tables: [user]
   5. (May have to use ">>USE scheduler;" when creating tables and making queries)
5. Start authentication server: npm run start:dev2
   
## Frontend
1. Go into frontend directory: cd frontend
2. Install packages with npm: npm install
3. Start React dev server: npm start


