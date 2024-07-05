#!/bin/bash
VERSION=`cat version`

for plat in linux/amd64 linux/arm64; do
  echo "build platform: ${plat}"
  docker build --platform $plat -t shinhwagk/hjdb:${VERSION} -f Dockerfile.bun .
  docker tag shinhwagk/hjdb:${VERSION} shinhwagk/hjdb:latest

  docker push shinhwagk/hjdb:${VERSION}
  docker push shinhwagk/hjdb:latest
done
