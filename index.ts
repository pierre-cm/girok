import type { Transporter } from "./transporters"

import { formatText } from "./formatters/text.formatter"
import { formatJson } from "./formatters/json.formatter"

import { stdout as stdoutTransporter } from "./transporters/stdout.transporter"
import { file as fileTransporter } from "./transporters/file.transporter"

const LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const

export type Level = (typeof LEVELS)[number]
export type LoggerOptions = {
  level: Level
  formatter: "text" | "json" | Formatter
  outputs: (string | Transporter)[]
  bufferSize: number
  flushInterval?: number
  overrideConsole: boolean
}
export type LogMeta = {
  level: Level
  caller?: string
  ts: number
  context: Record<string, any>
}
export type Formatter = (meta: LogMeta, ...args: any[]) => string

const FORMATTERS: Record<string, Formatter> = {
  text: formatText(),
  json: formatJson(),
}

const makeLog = (
  lvl: number,
  options: LoggerOptions & { context: Record<string, any> },
  buffer: { push: (out: string) => void }
) => {
  lvl = lvl % LEVELS.length
  let formatter: Formatter

  if (typeof options.formatter === "string")
    Object.keys(FORMATTERS).includes(options.formatter)
      ? (formatter = FORMATTERS[options.formatter])
      : (formatter = FORMATTERS.text)
  else if (typeof options.formatter === "function")
    formatter = options.formatter

  return (...args: any[]) => {
    if (lvl < LEVELS.indexOf(options.level)) return
    let caller = new Error().stack?.split("\n")?.[2].match(/\((.*)\)$/)?.[1]
    let ts = Date.now()
    let level = LEVELS[lvl]
    let out = formatter(
      { level, caller, ts, context: options.context },
      ...args
    )
    buffer.push(out)
    if (level === "fatal") process.exit(1)
  }
}

export type Logger = Record<Level, (...args: any[]) => void> & {
  context: (ctx: Record<string, any>) => Logger
}
export const logger = (options?: Partial<LoggerOptions>): Logger => {
  const opt: LoggerOptions = {
    level:
      options?.level && LEVELS.includes(options.level) ? options.level : "info",
    formatter: options?.formatter || "text",
    outputs: options?.outputs || ["stdout"],
    bufferSize: options?.bufferSize || 1,
    flushInterval: options?.flushInterval,
    overrideConsole: options?.overrideConsole || false,
  }

  const makeLogger = (ctx: Record<string, any> = {}) => {
    let n = 0
    let noBufLimit = !options?.bufferSize && options?.flushInterval
    let _buff = new Array<string>(opt.bufferSize).fill("")

    const flushOutput = (b: string[]) => {
      for (const output of opt.outputs) {
        if (typeof output === "string") {
          if (output === "stdout") stdoutTransporter(b)
          else if (output.startsWith("file://"))
            fileTransporter({ path: output.slice(7) })(b)
        } else output(b)
      }
    }

    process.on("exit", () => flushOutput(_buff))

    if (opt.flushInterval)
      setInterval(() => {
        flushOutput(_buff)
        _buff = []
      }, opt.flushInterval)

    const buffer = {
      push: (out: string) => {
        if (noBufLimit) {
          _buff.push(out)
        } else {
          _buff[n] = out
          n++
          if (n % opt.bufferSize === 0) {
            flushOutput(_buff)
            _buff.fill("")
            n = 0
          }
        }
      },
    }

    return {
      ...(Object.fromEntries(
        LEVELS.map((l, i) => {
          const log = makeLog(i, { ...opt, context: ctx }, buffer)
          if (opt.overrideConsole) {
            //@ts-ignore
            if (l in console) console[l] = log
            if (l === "info") console.log = log
          }
          return [l, log]
        })
      ) as Record<Level, (...args: any[]) => void>),
      context: (c: Record<string, any> = {}) => makeLogger({ ...ctx, ...c }),
    }
  }

  return makeLogger({})
}
