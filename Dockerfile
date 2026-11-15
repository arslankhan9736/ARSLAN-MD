FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy all other project files
COPY . .

# Expose port (Heroku automatically PORT assign karta hai)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
