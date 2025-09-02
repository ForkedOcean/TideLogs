# Build stage
FROM rust:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY . .

# Build the application
RUN cargo build --release

EXPOSE 8080
CMD ["./target/release/tidelogs-backend"]