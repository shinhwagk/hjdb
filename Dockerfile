FROM denoland/deno:alpine-1.44.0

RUN mkdir /app/
COPY main.ts /app/main.ts

VOLUME /data
EXPOSE 8000

ENTRYPOINT ["deno", "run", "--allow-all", "/app/main.ts"]