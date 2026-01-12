FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]
