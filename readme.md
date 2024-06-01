# a simple json database by http

each db is a json file

## Running

```sh
docker run -d --name hjdb -p8000:8000 -v /tmp/data:/data shinhwagk/hjdb:latest

# update/insert db data
curl -XPOST http://localhost:8000/db/db1 -d '{"a":"dfdf2"}'
# responce {"state":"ok","db":"db1","err":null,"data":null}

# get db data
curl -XGET http://localhost:8000/db/db1
# responce {"state":"ok","db":"db1","data":{"a":"dfdf2"},"err":null}
```
