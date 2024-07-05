for store in file memory; do
  for method in post get; do
    echo "${method} ${store}"
    wrk -t10 -c10 -d10s -s ${method}_${store}.lua http://127.0.0.1:8000
  done
done