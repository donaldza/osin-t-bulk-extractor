FROM debian:bookworm-slim AS engine-build
WORKDIR /src
RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf automake g++ flex libabsl-dev libexpat1-dev libre2-dev libssl-dev \
    libtool libxml2-utils make pkg-config python3 zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN ./bootstrap.sh && ./configure --enable-silent-rules && make -j2

FROM python:3.11-slim-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libabsl20220623 libexpat1 libre2-9 libssl3 zlib1g \
    && rm -rf /var/lib/apt/lists/*
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api .
COPY --from=engine-build /src/src/bulk_extractor /usr/local/bin/bulk_extractor
ENV ENGINE_BINARY=/usr/local/bin/bulk_extractor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
