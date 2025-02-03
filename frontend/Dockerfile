# frontend/Dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port 3000 (assuming your React app runs on this port)
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
