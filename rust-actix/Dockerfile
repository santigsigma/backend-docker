# Stage 1: Builder
FROM rust:latest as builder

WORKDIR /app

# Copiar archivos de dependencias
COPY Cargo.toml Cargo.lock* ./

# Crear estructura de directorios dummy para cachear dependencias
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copiar código fuente actual
COPY src ./src

# Forzar recompilación del código fuente real
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar binario desde builder
COPY --from=builder /app/target/release/backend-api .

# Variables de entorno por defecto
ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV DB_HOST=mysql
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=password
ENV DB_NAME=dbapp
ENV RUST_LOG=info

EXPOSE 8080

CMD ["./backend-api"]
