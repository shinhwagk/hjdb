#!/bin/bash
VERSION=`cat version`
docker build -t shinhwagk/hjdb:${VERSION} .
docker tag shinhwagk/hjdb:${VERSION} shinhwagk/hjdb:latest

docker push shinhwagk/hjdb:${VERSION}
docker push shinhwagk/hjdb:latest
