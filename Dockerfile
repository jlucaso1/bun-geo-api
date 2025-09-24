FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY src ./src

RUN bun run build


FROM gcr.io/distroless/base

WORKDIR /

COPY --from=builder /usr/src/app/dist/geo-api /geo-api

EXPOSE 3000

ENTRYPOINT ["/geo-api"]