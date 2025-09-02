-- TideLogs Database Initialization Script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create logs table
CREATE TABLE logs (
                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      service VARCHAR(255) NOT NULL,
                      level VARCHAR(50) NOT NULL,
                      message TEXT NOT NULL,
                      metadata JSONB DEFAULT '{}',
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_service ON logs(service);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_service_level ON logs(service, level);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Create a GIN index for JSONB metadata queries
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata);

-- Insert some sample data for testing
INSERT INTO logs (service, level, message, metadata) VALUES
                                                         ('auth-service', 'INFO', 'User login successful', '{"user_id": "123", "ip": "192.168.1.1"}'),
                                                         ('auth-service', 'ERROR', 'Failed login attempt', '{"user_id": "456", "ip": "192.168.1.2", "error": "invalid_password"}'),
                                                         ('api-gateway', 'INFO', 'Request processed', '{"method": "GET", "path": "/users", "status": 200, "duration_ms": 45}'),
                                                         ('payment-service', 'WARN', 'High transaction volume detected', '{"transactions_per_minute": 150, "threshold": 100}'),
                                                         ('database', 'ERROR', 'Connection timeout', '{"timeout_ms": 5000, "retries": 3}'),
                                                         ('auth-service', 'INFO', 'User logout', '{"user_id": "123", "session_duration_minutes": 45}'),
                                                         ('api-gateway', 'ERROR', 'Rate limit exceeded', '{"ip": "192.168.1.3", "requests_per_minute": 120, "limit": 100}'),
                                                         ('notification-service', 'INFO', 'Email sent successfully', '{"recipient": "user@example.com", "template": "welcome"}'),
                                                         ('payment-service', 'INFO', 'Payment processed', '{"amount": 99.99, "currency": "USD", "payment_id": "pay_123"}'),
                                                         ('database', 'WARN', 'Slow query detected', '{"query_time_ms": 2500, "table": "users", "query": "SELECT * FROM users WHERE created_at > ..."}'::jsonb);