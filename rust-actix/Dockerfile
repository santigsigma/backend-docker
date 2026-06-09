FROM rust:latest

WORKDIR /app

COPY . .

RUN cargo build --release

ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV RUST_LOG=info

EXPOSE 8080

CMD ["./target/release/backend-api"]
