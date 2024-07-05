math.randomseed(os.time())  -- 初始化随机种子

function random_segment()
    local firstChar = string.char(math.random(65, 90))
    local numberPart = tostring(math.random(1, 100))
    return firstChar .. numberPart
end

function request()
    local segment1 = random_segment()
    local segment2 = random_segment()
    local segment3 = random_segment()
    local path = string.format("/memory/%s/%s/%s", segment1, segment2, segment3)

    wrk.method = "POST"
    wrk.body = string.format('{"key": %d}', math.random(1, 1000))
    wrk.headers["Content-Type"] = "application/json"
    return wrk.format(nil, path)
end
