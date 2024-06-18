# a simple json database by http

## Running
```sh
# for store type 'file': -v /data:/var/lib/hjdb
# example: /var/lib/hjdb/db1/tab1.json
docker run -d --name hjdb -p 8000:8000 -v /data:/var/lib/hjdb shinhwagk/hjdb:latest
```

## Api
```sh
# list all databases from memory
curl -XGET http://localhost:8000/memory

# list all databases from file
curl -XGET http://localhost:8000/file

# list tables of database from memory
curl -XGET http://localhost:8000/memory/db1

# list tables of database from file
curl -XGET http://localhost:8000/file/db1

# update table to memory
curl -XPOST http://localhost:8000/memory/db1/tab1 -d '{"a":"dfdf2"}'

# update table to file
curl -XPOST http://localhost:8000/file/db1/tab1 -d '{"a":"dfdf2"}'

# delete table from memory
curl -XDELETE http://localhost:8000/memory/db1/tab1

# delete table from file
curl -XDELETE http://localhost:8000/file/db1/tab1

# query table from memory
curl -XGET http://localhost:8000/memory/db1/tab1

# query table from file
curl -XGET http://localhost:8000/file/db1/tab1
```

# prometheus exporter
```sh
curl -XGET http://localhost:8000/metrics
```