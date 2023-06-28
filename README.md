# Pokedex App - Server

**Author**: Kawika Miller

**Version** 1.1

## Overview
This is the backend of the my Pokedex app which handles user signup & authentication and CRUD operations on the database

## Getting Started
If running this server locally you must add a `.env` file to the main directory which will need a `PORT` and `DATABASE_URL`

  - `PORT = 3001`

  - `DATABASE_URL = database_url_goes_here`

Run `npm i` to install all dependencies

Run `nodemon server.js` to start server

## Architecture
This was built using Node.js, MongoDB, and Mongoose

## Change Log

2023-03-?? : Initialized repo, create database schema for pokemon teams, add .POST method to save to database

2023-03-21 : Handle GET requests to get all teams from database and also one specific team from the database

2023-03-22 - 2023-06-19
- Add various routes for database interaction
  - Able to GET all teams in the database so that the user can see all of the teams they have created
  - Able to GET one team so that the user can select a specific team that they want to load to the client
  - Able to DELETE a team by it's database id
  - Able to PUT (update) a team by it's database id
- Added user login / signup / logout routes
  - Implement JWT, Base64, and bcrypt for user credentials
  - User credentials are stored in a database
  - Implement Basic & Bearer auth middleware
  - JWT is sent back and stored in an HTTP only cookie which is then sent with any subsequent requests from the client and put through the Bearer auth middleware
- Deploy server to Render
- Configure cookies properly
  - Ran into some issues with cookies being set in production because the front end and back end are on different domains
  - Resolved via cookie config options
- Added user reauthentication route
  - This route is hit when the app is refreshed &/o the page is reloaded
  - Checks to see if JWT stored in cookie is still valid (i.e. not expired) and if it is then it sends a 200 response to the client

2023-06-20 - 2023-06-28
- Clear cookies on logout
- Add refresh token & implement refresh token rotation
- Add config modules for cookies and tokens
- Adjust reauthentication route to handle missing access token


## Credit and Collaborations