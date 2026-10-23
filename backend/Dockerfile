# ==============================================================
# GTEL Talento ATS - Backend Dockerfile (Multi-stage Build)
# JDK 21 Eclipse Temurin + Apache Maven
# ==============================================================

# --------------------------------------------------------------
# Etapa 1: Compilación del archivo JAR con Maven
# --------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache de dependencias de Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia de código fuente y empaquetado del artefacto
COPY src ./src
RUN mvn clean package -DskipTests -B

# --------------------------------------------------------------
# Etapa 2: Imagen de ejecución ligera con JRE 21 Alpine
# --------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Seguridad: Crear usuario sin privilegios root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Directorio para almacenamiento persistente de CVs subidos
RUN mkdir -p /app/uploads/cv && chown -R appuser:appgroup /app

# Copia del ejecutable generado desde la etapa de compilación
COPY --from=builder /build/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8080

# Variables de entorno por defecto
ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=default \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Healthcheck interno del contenedor
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
