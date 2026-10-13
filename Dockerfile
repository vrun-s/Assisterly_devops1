# ==============================================================================
# Assisterly Caregiver Platform — Production Container
# Multi-arch compatible, non-root user, persistent volume for SQLite database.
# ==============================================================================

FROM python:3.11-slim

# Set environment variables for Python runtime and application defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/app/data/assisterly.db \
    FLASK_ENV=production

# Install curl for Docker health checks and ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy dependency definition first for optimal layer caching
COPY requirements.txt .

# Install dependencies in system Python (no cache to keep image small)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create persistent storage directory for SQLite database
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Copy application assets and source code
COPY . .

# Ensure appuser owns the application files
RUN chown -R appuser:appuser /app

# Declare persistent volume mount point
VOLUME ["/app/data"]

# Switch to non-root execution
USER appuser

# Expose web service port
EXPOSE 5000

# Docker native health check hitting /api/health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application server
CMD ["python", "app.py"]
