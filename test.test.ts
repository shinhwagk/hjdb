import { test, expect } from "bun:test";

import { ResponseData } from './src/types'
import * as he from './src/error'

interface TestCase {
    method: string
    path: string
    data?: object
    expected: ResponseData
}

const testCases: TestCase[] = [
    { method: "GET", path: "/", expected: { state: "err", errmsg: "urls: /metrics, /file, /memory" } },
    { method: "GET", path: "/file", expected: { state: "ok", data: [] } },
    { method: "GET", path: "/memory", expected: { state: "ok", data: [] } },
    { method: "GET", path: "/file/db1/sch1/tab1", expected: { state: "err", errcode: he.HJDBErrorCode.HJDB002, errmsg: he.HJDBErrorMsg.HJDB002 } },
    { method: "GET", path: "/memory/db1/sch1/tab1", expected: { state: "err", errcode: he.HJDBErrorCode.HJDB002, errmsg: he.HJDBErrorMsg.HJDB002 } },
    { method: "POST", path: "/file/db1/sch1/tab1?asynccommit=false", data: { "a": 1 }, expected: { state: "ok" } },
    { method: "POST", path: "/memory/db1/sch1/tab1", data: { "a": 1 }, expected: { state: "ok" } },
    { method: "POST", path: "/file/db1/sch1/tab2?asynccommit=false", data: { "a": 1 }, expected: { state: "ok" } },
    { method: "POST", path: "/memory/db1/sch1/tab2", data: { "a": 1 }, expected: { state: "ok" } },
    { method: "DELETE", path: "/file/db1/sch1/tab2?asynccommit=false", expected: { state: "ok" } },
    { method: "DELETE", path: "/memory/db1/sch1/tab2", expected: { state: "ok" } },
    { method: "GET", path: "/file/db1/sch1/tab2", expected: { state: "err", errcode: he.HJDBErrorCode.HJDB001, errmsg: he.HJDBErrorMsg.HJDB001 } },
    { method: "GET", path: "/memory/db1/sch1/tab2", expected: { state: "err", errcode: he.HJDBErrorCode.HJDB001, errmsg: he.HJDBErrorMsg.HJDB001 } },
    { method: "GET", path: "/file", expected: { state: "ok", data: ["db1"] } },
    { method: "GET", path: "/memory", expected: { state: "ok", data: ["db1"] } },
    { method: "GET", path: "/file/db1", expected: { state: "ok", data: ["sch1"] } },
    { method: "GET", path: "/memory/db1", expected: { state: "ok", data: ["sch1"] } },
    { method: "GET", path: "/file/db1/sch1", expected: { state: "ok", data: ["tab1"] } },
    { method: "GET", path: "/memory/db1/sch1", expected: { state: "ok", data: ["tab1"] } },
    { method: "GET", path: "/file/db1/sch1/tab1", expected: { state: "ok", data: { "a": 1 } } },
    { method: "GET", path: "/memory/db1/sch1/tab1", expected: { state: "ok", data: { "a": 1 } } },
    { method: "POST", path: "/file/db1/sch1/tab1?asynccommit=false", data: { "a": 2 }, expected: { state: "ok" } },
    { method: "POST", path: "/memory/db1/sch1/tab1", data: { "a": 2 }, expected: { state: "ok" } },
    { method: "GET", path: "/file/db1/sch1/tab1", expected: { state: "ok", data: { "a": 2 } } },
    { method: "GET", path: "/memory/db1/sch1/tab1", expected: { state: "ok", data: { "a": 2 } } },
    { method: "DELETE", path: "/file/db1/sch1/tab1?asynccommit=false", expected: { state: "ok" } },
    { method: "DELETE", path: "/memory/db1/sch1/tab1", expected: { state: "ok" } },
];

function runTests(baseUrl: string, testCases: TestCase[]) {
    for (const tc of testCases) {
        test(`${tc.method} ${tc.path}`, async () => {
            let res: ResponseData | undefined = undefined

            if (tc.method === "GET") {
                res = await (await fetch(`${baseUrl}${tc.path}`)).json()
            } else if (tc.method === "POST") {
                res = await (await fetch(`${baseUrl}${tc.path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tc.data)
                })).json()
            } else if (tc.method === "DELETE") {
                res = await (await fetch(`${baseUrl}${tc.path}`, { method: 'DELETE' })).json()
                console.log(res)
            }


            if (res) {
                expect(tc.expected.state).toBe(res.state);

                if (tc.expected.errmsg) {
                    expect(tc.expected.errmsg).toBe(res.errmsg!);
                }
                if (tc.expected.errcode) {
                    expect(tc.expected.errcode).toBe(res.errcode!);
                }
                if (tc.expected.data) {
                    expect(tc.expected.data).toEqual(res.data!);
                }
            }
        });
    }
}

const baseURL = "http://127.0.0.1:8000";
runTests(baseURL, testCases);