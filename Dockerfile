FROM node:22 as builder

WORKDIR /build
COPY package.json tsconfig.json .
RUN npm i

COPY src/*.ts .
RUN npm run compile

######################################

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /build/dist/*.js .

VOLUME /var/lib/hjdb
EXPOSE 8000

ENTRYPOINT ["node", "/app/main.js"]