FROM rust:1.76-slim-bullseye AS builder

WORKDIR /usr/src/app
# Copy the source code
COPY backend .

# Build the application
RUN cargo build --release

# Create a new stage with a minimal image
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/target/release/game_platform_backend /app/bagame-backend

# Expose the port the app runs on
EXPOSE 8000

# Run the binary
CMD ["./bagame-backend"]
