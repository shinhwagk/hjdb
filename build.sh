#!/bin/bash
VERSION=`cat version`

for plat in linux/amd64 linux/arm64; do
  docker build --platform $plat -t shinhwagk/hjdb:${VERSION} .
  docker tag shinhwagk/hjdb:${VERSION} shinhwagk/hjdb:latest

  docker push shinhwagk/hjdb:${VERSION}
  docker push shinhwagk/hjdb:latest
done

# docker push shinhwagk/hjdb:${VERSION}
# docker push shinhwagk/hjdb:latest

# docker buildx version
# docker buildx create --name builder-hjdb --use
# docker buildx inspect --bootstrap

# docker buildx build --platform linux/amd64,linux/arm64 -t shinhwagk/hjdb:${VERSION} --push .
# docker buildx build --platform linux/amd64,linux/arm64 -t shinhwagk/hjdb:latest --push .

# docker buildx rm builder-hjdb
