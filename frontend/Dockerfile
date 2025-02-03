# Use the official lightweight Node.js image (version 16 on Alpine Linux)
# as the base image for the frontend application.
FROM node:16-alpine

# Set the working directory inside the container to /app.
# All subsequent commands will run from this directory.
WORKDIR /app

# Copy the package.json and package-lock.json files into the container.
# This is done first so that dependency installation can be cached by Docker.
COPY package*.json ./

# Install the dependencies specified in package.json.
# The '--no-cache-dir' option is not necessary for npm, but the alpine image is lightweight.
RUN npm install

# Copy the rest of the application source code into the container.
# This includes all your React components, configuration files, etc.
COPY . .

# Expose port 3000 so that the container can serve the React app on that port.
EXPOSE 3000

# Start the React application using the npm start command.
# This command will run the "start" script defined in package.json.
CMD ["npm", "start"]
