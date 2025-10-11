# 1. Start with a lean Node.js image
FROM node:18-slim

# 2. Install Git and clean up the package cache in the same step
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files (this is cached unless these files change)
COPY package*.json ./

# Install your app's Node.js dependencies
RUN npm install

# Copy the rest of your application's code
COPY . .

# Tell Docker which port the app will run on
EXPOSE 7860

# The command to start your application
CMD [ "npm", "start" ]