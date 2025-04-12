# Use Python 3.12 bookworm as base image
FROM python:3.12-bookworm

# Install uv
RUN pip install uv

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Copy project files
COPY . /app

# Install the project and its dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable

# when running the container, add --db-path and a bind mount to the host's db file
ENTRYPOINT ["uv", "run", "mcp-excel"]
