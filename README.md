# Session Scheduling App
A Collaborative Session Scheduling Web App where users can invite people to sessions via links to collaboratively plan an activity.

Developed using a Microservice Architecture in mind. 

Backend: Node.js, Express.js, Passport.js, JSON Web Tokens, Socket.io

Frontend: React.js, React Bootstrap, D3


# Quickstart:

## Backend
1. Go into backend directory: cd backend
2. Install packages with npm: npm install
3. include .env file in ./backend directory
   1. Format:
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    ACCESS_TOKEN_SECRET=
    REFRESH_TOKEN_SECRET=
    DB_DATABASE=
    DB_USER=
    DB_HOST=
    NODE_ENV=development
4. Start XAMPP software.
   1. Start Apache and MySQL modules.
   2. Open MySQL Admin (opens up browser to PHPMyAdmin)
   3. Create database with name "scheduler": CREATE DATABASE scheduler;
   4. Manually add needed tables. Check init.sql for table references. Currently used tables: [user]
   5. (May have to use ">>USE scheduler;" when creating tables and making queries)
5. Start API server: npm run start:dev
   
## Frontend
1. Go into frontend directory: cd frontend
2. Install packages with npm: npm install
3. Start React dev server: npm start


