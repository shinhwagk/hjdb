# a simple json database by http

## Running
```sh
# for store type 'file': -v /data:/var/lib/hjdb
# example: /var/lib/hjdb/db1/tab1.json
docker run -d --name hjdb -p 8000:8000 -v /data:/var/lib/hjdb shinhwagk/hjdb:0.5.9
```

## Api
```sh
# list all databases from memory
curl -s -XGET http://localhost:8000/memory | jq

# list all databases from file
curl -s -XGET http://localhost:8000/file | jq

# list tables of database from memory
curl -s -XGET http://localhost:8000/memory/db1 | jq

# list tables of database from file
curl -s -XGET http://localhost:8000/file/db1 | jq

# update table to memory
curl -s -XPOST http://localhost:8000/memory/db1/sch1/tab1 -d '{"a":"dfdf2"}' | jq

# update table to file
curl -s -XPOST http://localhost:8000/file/db1/sch1/tab1 -d '{"a":"dfdf2"}' | jq

# delete table from memory
curl -s -XDELETE http://localhost:8000/memory/db1/sch1/tab1 | jq

# delete table from file
curl -s -XDELETE http://localhost:8000/file/db1/sch1/tab1 | jq

# query table from memory
curl -s -XGET http://localhost:8000/memory/db1/sch1/tab1 | jq

# query table from file
curl -s -XGET http://localhost:8000/file/db1/sch1/tab1 | jq
```

# prometheus exporter
```sh
curl -s -XGET http://localhost:8000/metrics
```