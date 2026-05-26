use actix_web::{web, App, HttpResponse, HttpServer, middleware};
use serde::{Deserialize, Serialize};
use mysql::*;
use std::sync::Mutex;
use chrono::Local;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Item {
    id: String,
    nombre: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ItemRequest {
    nombre: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DbStatusResponse {
    status: String,
    connection: bool,
    timestamp: String,
    db_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ItemsResponse {
    items: Vec<Item>,
    total: usize,
}

// GET /health - Sin consulta a BD
async fn health_check() -> HttpResponse {
    let response = HealthResponse {
        status: "API is running".to_string(),
        timestamp: Local::now().to_rfc3339(),
    };
    HttpResponse::Ok().json(response)
}

// GET /db-status - Consulta la BD
async fn db_status(db: web::Data<Mutex<PooledConn>>) -> HttpResponse {
    match db.lock() {
        Ok(mut conn) => {
            match conn.query::<String, _>("SELECT NOW() as db_time") {
                Ok(mut result) => {
                    let db_time = result.next()
                        .and_then(|row| row.ok())
                        .and_then(|row| row.get::<String, _>(0).ok());
                    
                    let response = DbStatusResponse {
                        status: "Database connection successful".to_string(),
                        connection: true,
                        timestamp: Local::now().to_rfc3339(),
                        db_time,
                    };
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    log::error!("DB query failed: {}", e);
                    let response = DbStatusResponse {
                        status: format!("Database query failed: {}", e),
                        connection: false,
                        timestamp: Local::now().to_rfc3339(),
                        db_time: None,
                    };
                    HttpResponse::InternalServerError().json(response)
                }
            }
        }
        Err(e) => {
            log::error!("Failed to lock connection: {}", e);
            let response = DbStatusResponse {
                status: "Failed to acquire database connection".to_string(),
                connection: false,
                timestamp: Local::now().to_rfc3339(),
                db_time: None,
            };
            HttpResponse::InternalServerError().json(response)
        }
    }
}

// GET /items - Lista todos los items
async fn get_items(db: web::Data<Mutex<PooledConn>>) -> HttpResponse {
    match db.lock() {
        Ok(mut conn) => {
            match conn.query::<(u32, String, String), _>(
                "SELECT id, nombre, created_at FROM items ORDER BY created_at DESC"
            ) {
                Ok(result) => {
                    let items: Vec<Item> = result.iter()
                        .map(|(id, nombre, created_at)| Item {
                            id: id.to_string(),
                            nombre: nombre.clone(),
                            created_at: created_at.clone(),
                        })
                        .collect();
                    
                    let total = items.len();
                    let response = ItemsResponse { items, total };
                    HttpResponse::Ok().json(response)
                }
                Err(e) => {
                    log::error!("Failed to fetch items: {}", e);
                    HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": "Failed to fetch items"}))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to lock connection: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database connection error"}))
        }
    }
}

// POST /items - Crea un nuevo item
async fn create_item(
    db: web::Data<Mutex<PooledConn>>,
    req: web::Json<ItemRequest>,
) -> HttpResponse {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Local::now().to_rfc3339();
    
    match db.lock() {
        Ok(mut conn) => {
            let stmt = "INSERT INTO items (id, nombre, created_at) VALUES (?, ?, ?)";
            match conn.exec_drop(stmt, (id.clone(), req.nombre.clone(), now.clone())) {
                Ok(_) => {
                    let item = Item {
                        id,
                        nombre: req.nombre.clone(),
                        created_at: now,
                    };
                    HttpResponse::Created().json(item)
                }
                Err(e) => {
                    log::error!("Failed to insert item: {}", e);
                    HttpResponse::InternalServerError()
                        .json(serde_json::json!({"error": "Failed to create item"}))
                }
            }
        }
        Err(e) => {
            log::error!("Failed to lock connection: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database connection error"}))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let db_host = std::env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string());
    let db_port = std::env::var("DB_PORT").unwrap_or_else(|_| "3306".to_string());
    let db_user = std::env::var("DB_USER").unwrap_or_else(|_| "root".to_string());
    let db_password = std::env::var("DB_PASSWORD").unwrap_or_else(|_| "password".to_string());
    let db_name = std::env::var("DB_NAME").unwrap_or_else(|_| "dbapp".to_string());
    let app_port = std::env::var("APP_PORT").unwrap_or_else(|_| "8080".to_string());
    let app_host = std::env::var("APP_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());

    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        db_user, db_password, db_host, db_port, db_name
    );

    log::info!("🚀 Connecting to database at {}:{}", db_host, db_port);
    
    let pool = match Pool::new(url.as_str()) {
        Ok(p) => {
            log::info!("✅ Database connection pool created");
            p
        }
        Err(e) => {
            log::error!("❌ Failed to create connection pool: {}", e);
            panic!("Database connection failed: {}", e);
        }
    };

    let conn = match pool.get_conn() {
        Ok(c) => {
            log::info!("✅ Successfully connected to database");
            c
        }
        Err(e) => {
            log::error!("❌ Failed to get connection: {}", e);
            panic!("Failed to get database connection: {}", e);
        }
    };

    let db = web::Data::new(Mutex::new(conn));

    let bind = format!("{}:{}", app_host, app_port);
    log::info!("🚀 Starting server at http://{}", bind);

    HttpServer::new(move || {
        App::new()
            .app_data(db.clone())
            .wrap(middleware::Logger::default())
            .route("/health", web::get().to(health_check))
            .route("/db-status", web::get().to(db_status))
            .route("/items", web::get().to(get_items))
            .route("/items", web::post().to(create_item))
    })
    .bind(&bind)?
    .run()
    .await
}
