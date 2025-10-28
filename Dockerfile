# Dockerfile for fragments microservice
# Multi-stage build for optimal image size
# This file defines the instructions for Docker Engine to create a Docker Image
# The image will contain a Node.js server that runs the fragments API

# Stage 1: Build stage
# Use full Node.js image for installing dependencies and building
FROM node:22.12.0-alpine AS builder
LABEL maintainer="Mannatpreet Singh Khurana <khurana.mannat22@gmail.com>"
LABEL description="Fragments node.js microservice (build stage)"

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package.json and package-lock.json files into the image
# We copy these first to leverage Docker's layer caching
# If dependencies don't change, we can reuse this layer
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for tests)
# This stage can be larger since it won't be in the final image
RUN npm ci

# Copy our application source code into the image
# All source code is in the src/ directory
COPY ./src ./src

# Copy HTPASSWD file for basic authentication (needed for testing)
COPY ./tests/.htpasswd ./tests/.htpasswd

# Stage 2: Production stage
# Use Alpine-based Node.js image for much smaller final image size
FROM node:22.12.0-alpine AS production
LABEL maintainer="Mannatpreet Singh Khurana <khurana.mannat22@gmail.com>"
LABEL description="Fragments node.js microservice (production)"

# We default to use port 8080 in our service
ENV PORT=8080
ENV NODE_ENV=production

# Reduce npm spam when running within Docker
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package*.json files from builder
COPY package*.json ./

# Install ONLY production dependencies
# This significantly reduces the final image size
RUN npm ci --only=production && \
    # Clean npm cache to reduce image size
    npm cache clean --force

# Copy application source code from builder stage
# Only copy production code, not tests
COPY --from=builder /app/src ./src

# Create tests directory and copy HTPASSWD file for basic authentication (needed for testing in production)
COPY --from=builder /app/tests/.htpasswd ./tests/.htpasswd

# Create a non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8080 to indicate what port the container listens on
# This is mostly for documentation purposes
EXPOSE 8080

# Start the container by running our server
# Using JSON format to prevent issues with OS signals
CMD ["node", "src/index.js"]
