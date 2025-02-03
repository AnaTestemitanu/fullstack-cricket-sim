# Use a lightweight official Python image based on Debian (slim variant) as the base image.
FROM python:3.9-slim

# Set the working directory inside the container to /app.
WORKDIR /app

# Copy the requirements.txt file into the container.
# This file contains all the Python package dependencies for the backend.
COPY requirements.txt .

# Install the required Python packages using pip.
# The '--no-cache-dir' option prevents pip from caching packages to keep the image size small.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container.
# This includes your main.py, models, database.py, and any other backend files.
COPY . .

# Expose port 8000 so that the container can accept connections on this port.
# Uvicorn (the ASGI server) will run on this port by default.
EXPOSE 8000

# Define the command to run when the container starts.
# This starts the application using Uvicorn, binding to all interfaces (0.0.0.0) on port 8000.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]