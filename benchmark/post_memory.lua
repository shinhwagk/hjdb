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
    local path = string.format("/memory/%s/%s/%s", segment1, segment2, segment3)

    wrk.method = "POST"
    wrk.body = string.format('{"key": %d}', math.random(1, 1000))
    wrk.headers["Content-Type"] = "application/json"
    return wrk.format(nil, path)
end
