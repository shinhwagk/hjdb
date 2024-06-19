FROM node:22 as builder

RUN npm i -g typescript

WORKDIR /build
COPY tsconfig.json .

COPY src/*.ts .
RUN tsc -p .

######################################

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /build/dist/*.js .

VOLUME /var/lib/hjdb
EXPOSE 8000

ENTRYPOINT ["node", "/app/main.js"]