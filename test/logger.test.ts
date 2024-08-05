import { describe, test, expect, afterAll } from "bun:test"
import { logger, type Logger, type LogMeta } from ".."

describe("logger", () => {
  let psw = process.stdout.write
  const mock = (_meta: LogMeta, ...args: any[]) => `${args.join("")}\n`

  afterAll(() => (process.stdout.write = psw))

  test("default", () => {
    let results: string[] = []

    process.stdout.write = (...args) => {
      results.push((args[0] as string).trim())
      return true
    }

    const log = logger({ formatter: mock })

    log.info("test")

    expect(results).toEqual(["test"])
  })

  test("level", () => {
    let results: any[] = []

    process.stdout.write = (...args) => {
      results.push((args[0] as string).trim())
      return true
    }

    const logAll = (log: Logger) => {
      log.trace("trace")
      log.debug("debug")
      log.info("info")
      log.warn("warn")
      log.error("error")
    }

    // trace
    let log = logger({ formatter: mock, level: "trace" })
    logAll(log)
    expect(results).toEqual(["trace", "debug", "info", "warn", "error"])
    results = []

    // info
    log = logger({ formatter: mock, level: "info" })
    logAll(log)
    expect(results).toEqual(["info", "warn", "error"])
    results = []

    // warn
    log = logger({ formatter: mock, level: "warn" })
    logAll(log)
    expect(results).toEqual(["warn", "error"])
    results = []

    // error
    log = logger({ formatter: mock, level: "error" })
    logAll(log)
    expect(results).toEqual(["error"])
    results = []
  })

  test("buffer size", () => {
    let results: any[] = []

    process.stdout.write = (...args) => {
      results.push(args[0])
      return true
    }

    // default (bufferSize = 1)
    let log = logger({ formatter: mock })
    log.info("1")
    expect(results).toEqual(["1\n"])
    log.info("2")
    expect(results).toEqual(["1\n", "2\n"])
    log.info("3")
    expect(results).toEqual(["1\n", "2\n", "3\n"])
    results = []

    // bufferSize 3
    log = logger({ formatter: mock, level: "trace", bufferSize: 3 })
    log.info("1")
    expect(results).toEqual([])
    log.info("2")
    expect(results).toEqual([])
    log.info("3")
    expect(results).toEqual(["1\n2\n3\n"])
    log.info("4")
    expect(results).toEqual(["1\n2\n3\n"])
    log.info("5")
    expect(results).toEqual(["1\n2\n3\n"])
    log.info("6")
    expect(results).toEqual(["1\n2\n3\n", "4\n5\n6\n"])
  })

  test("flush interval", () => {
    let results: any[] = []

    process.stdout.write = (...args) => {
      results.push(args[0])
      return true
    }

    // default (direct)
    let log = logger({ formatter: mock })
    log.info("1")
    expect(results).toEqual(["1\n"])
    log.info("2")
    expect(results).toEqual(["1\n", "2\n"])
    log.info("3")
    expect(results).toEqual(["1\n", "2\n", "3\n"])
    results = []

    // flushInterval 3s
    log = logger({ formatter: mock, flushInterval: 3000 })
    log.info("1")
    expect(results).toEqual([])
    log.info("2")
    log.info("3")
    expect(results).toEqual([])
    setTimeout(() => {
      expect(results).toEqual([])
    }, 2000)
    setTimeout(() => {
      expect(results).toEqual(["1\n2\n3\n"])
    }, 3000)
  })

  test("bufferSize + flush interval", () => {
    let results: any[] = []

    process.stdout.write = (...args) => {
      results.push(args[0])
      return true
    }

    // bufferSize 3 & flushInterval 3s
    let log = logger({ formatter: mock, bufferSize: 3, flushInterval: 3000 })

    log.info("1")
    expect(results).toEqual([])
    log.info("2")
    log.info("3")
    expect(results).toEqual(["1\n2\n3\n"])

    log.info("4")
    log.info("5")
    expect(results).toEqual(["1\n2\n3\n"])
    setTimeout(() => {
      expect(results).toEqual(["1\n2\n3\n", "4\n5\n"])
    }, 3000)
  })
})
