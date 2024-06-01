FROM denoland/deno:alpine-1.44.0

VOLUME /data
EXPOSE 8000

ENTRYPOINT ["deno", "run", "--allow-all", "https://cdn.jsdelivr.net/gh/shinhwagk/hjdb/main.ts"]