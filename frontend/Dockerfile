FROM node:18-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]