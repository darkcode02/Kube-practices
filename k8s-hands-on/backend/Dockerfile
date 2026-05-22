# Build multi-stage: compila el binario Go en una imagen con toolchain.
FROM golang:1.26-alpine AS builder
WORKDIR /app

# Copiar go.mod primero permite reutilizar cache de dependencias.
COPY go.mod ./
RUN go mod download

COPY . .
RUN go build -o app ./src

# Imagen final pequeña: solo contiene el binario ya compilado.
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/app .
# Puerto HTTP expuesto por main.go.
EXPOSE 8080
CMD ["./app"]
