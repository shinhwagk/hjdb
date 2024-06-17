FROM node:22-alpine

RUN mkdir /app/
COPY *.js /app/

VOLUME /var/lib/hjdb
EXPOSE 8000

ENTRYPOINT ["node", "/app/main.js"]