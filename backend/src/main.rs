use axum::{
    extract::{Query, State},
    http::{HeaderValue, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::collections::HashMap;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn, error};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct LogEntry {
    id: Option<Uuid>,
    timestamp: Option<DateTime<Utc>>,
    service: String,
    level: String,
    message: String,
    metadata: Option<Value>,
    created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
struct LogFilters {
    service: Option<String>,
    level: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Debug, Serialize)]
struct LogResponse {
    logs: Vec<LogEntry>,
    total: i64,
}

#[derive(Debug, Serialize)]
struct MetricsResponse {
    total_logs: i64,
    services: HashMap<String, i64>,
    levels: HashMap<String, i64>,
}

#[derive(Clone)]
struct AppState {
    pool: PgPool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Database connection
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:400151@localhost:5432/tidelogs".to_string());

    info!("Connecting to database at {}", database_url);

    // Retry connection logic
    let mut retries = 5;
    let pool = loop {
        match PgPool::connect(&database_url).await {
            Ok(pool) => break pool,
            Err(e) if retries > 0 => {
                warn!("Failed to connect to database, retrying... ({} attempts left)", retries);
                retries -= 1;
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
            Err(e) => {
                error!("Failed to connect to database after retries: {}", e);
                return Err(e.into());
            }
        }
    };

    info!("Database connected successfully");

    // Run migrations
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => info!("Migrations completed successfully"),
        Err(e) => {
            error!("Migration failed: {}", e);
            return Err(e.into());
        }
    }

    let state = AppState { pool };

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/logs", post(create_log))
        .route("/logs", get(get_logs))
        .route("/metrics", get(get_metrics))
        .layer(cors)
        .with_state(state);

    info!("🌊 TideLogs backend starting on 0.0.0.0:8080");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": Utc::now()
    }))
}

async fn create_log(
    State(state): State<AppState>,
    Json(log): Json<LogEntry>,
) -> Result<Json<LogEntry>, StatusCode> {
    // Validate input
    if log.service.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if log.message.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if !["ERROR", "WARN", "INFO", "DEBUG"].contains(&log.level.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let metadata = log.metadata.unwrap_or(Value::Object(serde_json::Map::new()));

    let row = sqlx::query(
        r#"
        INSERT INTO logs (service, level, message, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id, timestamp, service, level, message, metadata, created_at
        "#
    )
        .bind(log.service.trim())
        .bind(log.level.to_uppercase())
        .bind(log.message.trim())
        .bind(metadata)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            error!("Failed to insert log: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let response = LogEntry {
        id: Some(row.get("id")),
        timestamp: Some(row.get("timestamp")),
        service: row.get("service"),
        level: row.get("level"),
        message: row.get("message"),
        metadata: Some(row.get("metadata")),
        created_at: Some(row.get("created_at")),
    };

    info!("Created log entry: {} - {} - {}", response.service, response.level, response.message);
    Ok(Json(response))
}

async fn get_logs(
    State(state): State<AppState>,
    Query(filters): Query<LogFilters>,
) -> Result<Json<LogResponse>, StatusCode> {
    let limit = filters.limit.unwrap_or(100).min(1000);
    let offset = filters.offset.unwrap_or(0);

    let mut query = "SELECT id, timestamp, service, level, message, metadata, created_at FROM logs".to_string();
    let mut conditions = Vec::new();
    let mut param_count = 0;

    if let Some(service) = &filters.service {
        param_count += 1;
        conditions.push(format!("service = ${}", param_count));
    }

    if let Some(level) = &filters.level {
        param_count += 1;
        conditions.push(format!("level = ${}", param_count));
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(" ORDER BY timestamp DESC");
    param_count += 1;
    query.push_str(&format!(" LIMIT ${}", param_count));
    param_count += 1;
    query.push_str(&format!(" OFFSET ${}", param_count));

    // Build the actual query based on filters
    let rows = if let (Some(service), Some(level)) = (&filters.service, &filters.level) {
        sqlx::query(&query)
            .bind(service)
            .bind(level)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.pool)
            .await
    } else if let Some(service) = &filters.service {
        sqlx::query(&query)
            .bind(service)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.pool)
            .await
    } else if let Some(level) = &filters.level {
        sqlx::query(&query)
            .bind(level)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.pool)
            .await
    } else {
        sqlx::query(&query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.pool)
            .await
    };

    let rows = rows.map_err(|e| {
        warn!("Failed to fetch logs: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let logs: Vec<LogEntry> = rows
        .into_iter()
        .map(|row| LogEntry {
            id: Some(row.get("id")),
            timestamp: Some(row.get("timestamp")),
            service: row.get("service"),
            level: row.get("level"),
            message: row.get("message"),
            metadata: Some(row.get("metadata")),
            created_at: Some(row.get("created_at")),
        })
        .collect();

    // Get total count for pagination
    let total_query = if !conditions.is_empty() {
        let mut count_query = "SELECT COUNT(*) FROM logs WHERE ".to_string();
        count_query.push_str(&conditions.join(" AND "));
        count_query
    } else {
        "SELECT COUNT(*) FROM logs".to_string()
    };

    let total: i64 = if let (Some(service), Some(level)) = (&filters.service, &filters.level) {
        sqlx::query_scalar(&total_query)
            .bind(service)
            .bind(level)
            .fetch_one(&state.pool)
            .await
    } else if let Some(service) = &filters.service {
        sqlx::query_scalar(&total_query)
            .bind(service)
            .fetch_one(&state.pool)
            .await
    } else if let Some(level) = &filters.level {
        sqlx::query_scalar(&total_query)
            .bind(level)
            .fetch_one(&state.pool)
            .await
    } else {
        sqlx::query_scalar(&total_query)
            .fetch_one(&state.pool)
            .await
    }.map_err(|e| {
        warn!("Failed to count logs: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(LogResponse {
        logs,
        total,
    }))
}

async fn get_metrics(
    State(state): State<AppState>,
) -> Result<Json<MetricsResponse>, StatusCode> {
    // Get total logs count
    let total_logs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM logs")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            warn!("Failed to count total logs: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Get logs by service
    let service_rows = sqlx::query("SELECT service, COUNT(*) as count FROM logs GROUP BY service")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            warn!("Failed to fetch service metrics: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut services = HashMap::new();
    for row in service_rows {
        let service: String = row.get("service");
        let count: i64 = row.get("count");
        services.insert(service, count);
    }

    // Get logs by level
    let level_rows = sqlx::query("SELECT level, COUNT(*) as count FROM logs GROUP BY level")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            warn!("Failed to fetch level metrics: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut levels = HashMap::new();
    for row in level_rows {
        let level: String = row.get("level");
        let count: i64 = row.get("count");
        levels.insert(level, count);
    }

    Ok(Json(MetricsResponse {
        total_logs,
        services,
        levels,
    }))
}