# Pokedex App - Server

**Author**: Kawika Miller

**Version** 1.0.2

## Overview
This is the backend of the my Pokedex app which handles the CRUD operations and database entries

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

## Credit and Collaborations