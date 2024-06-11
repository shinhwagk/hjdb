#!/bin/bash

curl http://127.0.0.1:8000/db/test/tab/tab1/store/memory
curl http://127.0.0.1:8000/db/test/tab/tab1/store/file

curl -XPOST http://127.0.0.1:8000/db/test/tab/tab1/store/memory -d '{"a":1}'

curl -XPOST http://127.0.0.1:8000/db/test/tab/tab1/store/file -d '{"a":1}'