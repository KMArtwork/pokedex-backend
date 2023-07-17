# Pokedex App - Server

**Author**: Kawika Miller

**Version** 1.25

[**Client Repo**](https://github.com/KMArtwork/pokedex)

## Overview
This is the backend of the my Pokedex app which handles user authorization & authentication, proxy requests to PokeAPI, and the CRUD operations for the database

## Features
- User authorization and authentication
  - Access tokens & refresh tokens as HTTP only cookies
  - Certain routes protected by bearer auth
- Proxy requests from the client
  - Fetches pokemon &/o item data from various PokeAPI endpoints and sends it all back as one object
- User data is saved to a database using MongoDB & Mongoose
  - User login information
  - Any/all pokemon teams that a user creates/saves with the team builder feature of the client
    - Only able to save/delete/modify a team if you're logged in
    - Only able to save/delete/modify a user's team (i.e. a user's teams are only visible to them )

## Getting Started
If running this server locally you must add a `.env` file to the main directory which will need a `PORT` and `DATABASE_URL`

  - `PORT = port_number_goes_here`

  - `DATABASE_URL = database_url_goes_here`

Run `npm i` to install all dependencies

Run `nodemon server.js` to start server

## Architecture
This was built using Node.js, Express.js, MongoDB, and Mongoose

## Change Log

### 2023-07-04 - 2023-07-17
- rework the main pokemon fetch function
  - break larger function bodies into smaller ones
- add alternate form route and refactor search function
  - handles 'gigantamax' and 'mega' form queries
- refresh token expires in 30d instead of 24h
- handle nidoran edge case

### 2023-06-29 - 2023-07-03
- Handle proxy requests from Client to PokeAPI
- Add server cache
  - Holds PokeAPI response data so that subsequent API calls do not need to be made and data can be fetched from the server cache instead which allows for faster response time
  - Example:
    1. A user searches for `Bulbasaur`. 
        - The server sends the request(s) to PokeAPI and receives the response. 
        - The response is saved to the server cache and sent back to the client.
    2. The user then searches for `Ivysaur`.
        - The server sends the request(s) to PokeAPI and receives the response. 
        - The response is saved to the server cache and sent back to the client.
    3. The user decides they want to go back and view `Bulbasaur`'s data again
        - Since `Bulbasaur`'s data already exists in the cache, the server does not need to send the request(s) to PokeAPI
        - Instead, the cached data is sent back to the client

### 2023-06-20 - 2023-06-28
- Clear cookies on logout
- Add refresh token & implement refresh token rotation
- Add config modules for cookies and tokens
- Adjust reauthentication route to handle missing access token

### 2023-03-22 - 2023-06-19
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

### 2023-03-21
- Handle GET requests to get all teams from database and also one specific team from the database

### 2023-03-??
- Initialized repo, create database schema for pokemon teams, add .POST method to save to database

## Credit and Collaborations