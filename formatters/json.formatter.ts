import type { LogMeta } from ".."
import { relative } from "path"
import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

const DEFAULT_FILTER = ["level", "caller", "ts", "context", "args"]
/**
 * Format log as JSON object. Each argument is treated as a sequence of alternating keys and values
 * @param filter keys to be included in the output
 * @param opt options
 * @example
 * log.info("key1", "val1", "key2", 42, "key3", {"foo":"bar"})
 * // {"level":"info","ts":123456789,"key1":"val1","key2":42,"key3":{"foo":"bar"}}
 */
export const formatJson = (
  filter: string[] = DEFAULT_FILTER,
  opt?: { tsFormat?: string; utc?: boolean }
) => {
  let f = new Set<string>(filter)
  return (meta: LogMeta, ...args: any[]) => {
    let { level, caller, ts, context } = meta
    let date: number | string | Dayjs = ts
    if (opt?.utc) date = dayjs.utc(ts)
    if (opt?.tsFormat) date = dayjs(ts).format(opt.tsFormat)
    let entries: Record<any, any> = {}
    if (args.length === 1) entries.message = args[0]
    else {
      for (let i = 0; i < args.length; i += 2) {
        if (typeof args[i] === "string" || typeof args[i] === "number")
          entries[args[i]] = i < args.length - 1 ? args[i + 1] : undefined
      }
    }
    return `${JSON.stringify({
      ...(f.has("level") ? { level: level.toUpperCase() } : {}),
      ...(f.has("caller") && caller
        ? { caller: relative(process.cwd(), caller) }
        : {}),
      ...(f.has("ts") ? { ts: date } : {}),
      ...(f.has("context") ? context : {}),
      ...(f.has("args") ? entries : {}),
    })}\n`
  }
}
