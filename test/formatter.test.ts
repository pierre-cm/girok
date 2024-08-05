import { describe, test, expect, afterAll, setSystemTime } from "bun:test"
import { logger } from ".."
import { formatJson } from "../formatters/json.formatter"
import { formatText } from "../formatters/text.formatter"

const BASE_FILTER = ["args", "level", "context"]
const BASE_FORMAT = "[%lvl%] %ctx% %args%"

describe("formatJson", () => {
  let psw = process.stdout.write

  afterAll(() => (process.stdout.write = psw))
  test("test case OK", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatJson(BASE_FILTER) })

    log.info(
      "a",
      42,
      "b",
      true,
      "c",
      { foo: "bar" },
      "d",
      [1],
      "func", // ignored
      () => {}
    )

    expect(JSON.parse(result[0])).toEqual({
      level: "INFO",
      a: 42,
      b: true,
      c: { foo: "bar" },
      d: [1],
      // func: "[Function: func]",
    })
  })

  test("test case 1 arg", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatJson(BASE_FILTER) })

    log.info({ foo: "bar" })

    expect(JSON.parse(result[0])).toEqual({
      level: "INFO",
      message: { foo: "bar" },
    })
  })

  test("test case odd args", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatJson(BASE_FILTER) })

    log.warn("one", 1, "orphan")

    expect(JSON.parse(result[0])).toEqual({ level: "WARN", one: 1 })
  })

  test("test case invalid key types", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatJson(BASE_FILTER) })

    log.error(
      { foo: "bar" },
      42,
      () => {},
      43,
      36,
      null,
      null,
      true,
      undefined,
      1
    )

    expect(JSON.parse(result[0])).toEqual({
      level: "ERROR",
      36: null,
    })
  })

  test("test case non duplicate key", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatJson(BASE_FILTER) })

    log.info("a", 1, "a", 2)

    expect(JSON.parse(result[0])).toEqual({ level: "INFO", a: 2 })
  })

  test("test case format ts", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    setSystemTime(new Date("1995-03-15T00:00:00.000Z"))
    const log = logger({
      formatter: formatJson(["ts"], { tsFormat: "DD/MM/YYYY" }),
    })

    log.info("Hello World!")

    expect(JSON.parse(result[0])).toEqual({ ts: "15/03/1995" })
  })
})

describe("formatText", () => {
  let psw = process.stdout.write

  afterAll(() => (process.stdout.write = psw))
  test("test case simple", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({ formatter: formatText(BASE_FORMAT, { ansi: false }) })

    log.info("Hello World!")

    expect(result[0]).toBe("[INFO]  Hello World!\n")
  })

  test("test case with context", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({
      formatter: formatText(BASE_FORMAT, { ansi: false }),
    }).context({ foo: "bar", test: 42, obj: { foo: "bar" } })

    log.info("Hello World!")

    expect(result[0]).toBe(
      `[INFO] foo="bar", test=42, obj={ foo: "bar" } Hello World!\n`
    )
  })

  test("test case inline", () => {
    let result1: any = null
    let result2: any = null

    const log1 = logger({
      formatter: formatText(BASE_FORMAT, { ansi: false, inline: true }),
    })
    const log2 = logger({
      formatter: formatText(BASE_FORMAT, { ansi: false, inline: false }),
    })

    process.stdout.write = (...args) => {
      result1 = args
      return true
    }
    log1.info({ foo: "bar", test: 42, obj: { foo: "bar" } })
    process.stdout.write = (...args) => {
      result2 = args
      return true
    }
    log2.info({ foo: "bar", test: 42, obj: { foo: "bar" } })

    expect(result1[0]).toBe(
      `[INFO]  { foo: "bar", test: 42, obj: { foo: "bar" } }\n`
    )
    expect(result2[0]).toBe(
      "[INFO]  \n" +
        "{ \n" +
        `  foo: "bar", \n` +
        `  test: 42, \n` +
        `  obj: { \n` +
        `    foo: "bar"\n` +
        "  }\n" +
        "}\n"
    )
  })

  test("test case buffer size", () => {
    let result: any = null
    process.stdout.write = (...args) => {
      result = args
      return true
    }
    const log = logger({
      formatter: formatText(BASE_FORMAT, { ansi: false }),
      bufferSize: 3,
    })

    log.info("one")
    expect(result?.[0]).toBeUndefined()
    log.info("two")
    expect(result?.[0]).toBeUndefined()
    log.info("three")

    expect(result[0]).toBe("[INFO]  one\n[INFO]  two\n[INFO]  three\n")
  })
})
