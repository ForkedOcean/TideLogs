# TideLogs

A lightweight log management and monitoring system designed for developers and small teams.

## Features

- **Fast Log Ingestion**: Rust-based backend for high-performance log processing
- **Structured Storage**: PostgreSQL database with optimized indexing
- **Real-time Dashboard**: Next.js frontend for log visualization and filtering
- **JSON Support**: Native support for structured log formats
- **Self-hostable**: Deploy anywhere with Docker

## Quick Start

1. **Clone the repository** (or create the file structure as shown below)

2. **Start the services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the dashboard**: http://localhost:3000

4. **Test the API**:
   ```bash
   ./test_api.sh
   ```

## API Endpoints

### POST /logs
Ingest new logs
```bash
curl -X POST http://localhost:8080/logs \
  -H "Content-Type: application/json" \
  -d '{
    "service": "my-app",
    "level": "INFO",
    "message": "Application started",
    "metadata": {"version": "1.0.0"}
  }'
```

### GET /logs
Retrieve logs with optional filtering
```bash
# Get all logs
curl http://localhost:8080/logs

# Filter by service
curl "http://localhost:8080/logs?service=auth-service"

# Filter by level
curl "http://localhost:8080/logs?level=ERROR"

# Multiple filters
curl "http://localhost:8080/logs?service=api-gateway&level=INFO&limit=50"
```

## Architecture

```
Frontend (Next.js) → Backend (Rust/Axum) → Database (PostgreSQL)
     :3000              :8080                :5432
```

## Development

### Prerequisites
- Docker & Docker Compose
- Rust (for local development)
- Node.js (for local development)

### Local Development

1. **Start database**:
   ```bash
   docker-compose up postgres -d
   ```

2. **Run backend locally**:
   ```bash
   cd backend
   cargo run
   ```

3. **Run frontend locally**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Configuration

### Environment Variables

**Backend**:
- `DATABASE_URL`: PostgreSQL connection string
- `RUST_LOG`: Log level (debug, info, warn, error)

**Frontend**:
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Rust, Axum, Serde, SQLx
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

## Future Roadmap

- OpenTelemetry support
- Email/Slack alerting
- AI-powered anomaly detection
- Role-based access control
- Multi-tenant SaaS offering

## License

MIT