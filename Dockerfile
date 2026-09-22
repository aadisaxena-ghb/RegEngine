# Build stage: Compile Pure Java SE Backend
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY scholaris/backend ./scholaris/backend
COPY scholaris/frontend ./scholaris/frontend

RUN javac -d scholaris/backend/out $(find scholaris/backend/src -name "*.java")

# Runtime stage: Lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/scholaris/backend/out ./scholaris/backend/out
COPY --from=builder /app/scholaris/backend/data ./scholaris/backend/data
COPY --from=builder /app/scholaris/frontend ./scholaris/frontend

EXPOSE 8080
ENV PORT=8080

WORKDIR /app/scholaris/backend
CMD ["java", "-cp", "out", "com.campus.Main", "8080"]
