# Dockerfile for fragments microservice
# This file defines the instructions for Docker Engine to create a Docker Image
# The image will contain a Node.js server that runs the fragments API

# Use Node.js version 22.12.0 as the base image
# This matches our local development environment (node v22.20.0)
FROM node:22.12.0
LABEL maintainer="Mannatpreet Singh Khurana <khurana.mannat22@gmail.com>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
# This creates the directory and sets it as the current working directory
WORKDIR /app

# Copy package.json and package-lock.json files into the image
# We copy these first to leverage Docker's layer caching
# If dependencies don't change, we can reuse this layer
COPY package*.json ./

# Install node dependencies defined in package-lock.json
# This will install all dependencies and create node_modules
RUN npm install

# Copy our application source code into the image
# All source code is in the src/ directory
COPY ./src ./src

# Copy our HTPASSWD file for basic authentication
# This file is needed when using basic auth configuration
COPY ./tests/.htpasswd ./tests/.htpasswd

# Expose port 8080 to indicate what port the container listens on
# This is mostly for documentation purposes
EXPOSE 8080

# Start the container by running our server
# This is the command that will be executed when the container starts
# Using JSON format to prevent issues with OS signals
CMD ["npm", "start"]
