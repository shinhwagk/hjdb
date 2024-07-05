local counter = 0

function segment(prefix)
    counter = counter + 1
    if counter > 1000 then
        counter = 1
    end
    return prefix .. tostring(counter)
end

function request()
    local segment1 = segment('db')
    local segment2 = segment('sch')
    local segment3 = segment('tab')
    local path = string.format("/file/%s/%s/%s", segment1, segment2, segment3)

    wrk.method = "GET"
    wrk.headers["Content-Type"] = "application/json"
    return wrk.format(nil, path)
end
