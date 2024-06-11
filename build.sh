#!/bin/bash
version=`cat version`
docker build -t shinhwagk/hjdb:${version} .

docker push shinhwagk/hjdb:${version}