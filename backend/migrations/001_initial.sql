-- Initial migration for TideLogs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
                                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    service VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_service_level ON logs(service, level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Create a GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_logs_metadata ON logs USING GIN(metadata);