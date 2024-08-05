import type { LogMeta } from ".."
import { relative } from "path"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { ANSI_CODE, LEVEL_ANSI, ansiFmt, objFormat } from "./util"

dayjs.extend(utc)

export const DEFAULT_FORMAT = "[%lvl%] %date% (%caller%) %ctx% %args%"
export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS"

/**
 * Format log message as text
 * @param fmt log message format
 * @param opt options
 *
 * @example
 * formatText("[%lvl%] %date% (%caller%) %args%", {depth: 4, ansi: false, inline: true})
 * // [INFO] 2022-01-01 00:00:00.000 (app.js) Hello World!
 * formatText("[%lvl%] %date.format(YYYY-MM-DD HH:mm:ss.SSS).utc% %ctx% %args%")
 * // [WARN] 2022-01-01 00:00:00.000 ctx1=42, ctx2="foo" Hello World!
 */
export const formatText = (
  fmt?: string,
  opt?: { ansi?: boolean; inline?: boolean; depth?: number | null }
) => {
  let format = fmt ?? DEFAULT_FORMAT
  let { ansi, inline, depth } = { ansi: true, inline: false, depth: 3, ...opt }

  return (meta: LogMeta, ...args: any[]) => {
    let log = `${format.replaceAll(/%([^%]+)%/g, (_, name) => {
      if (name === "lvl")
        return ansiFmt(
          meta.level.toUpperCase(),
          meta.level === "fatal" ? undefined : LEVEL_ANSI[meta.level],
          ansi
        )
      if (name.match("^date.?")) {
        let date = dayjs(meta.ts)
        let [_, df, tz] =
          name.match(/^date(?:\.format\(([^\)]*)\))?(?:\.(utc))?/) ?? []
        if (tz === "utc") date = date.utc()
        return date.format(df ?? DEFAULT_DATE_FORMAT)
      }
      if (name === "caller")
        return meta.caller ? relative(process.cwd(), meta.caller) : ""
      if (name === "ctx") {
        let l = `${Object.entries(meta.context)
          .map(
            ([k, v]) =>
              `${k}=${objFormat(v, {
                inline: true,
                depth: null,
                ansi: false,
              })}`
          )
          .join(", ")}`
        return ansi ? l : l.replaceAll(/\u001b\[[0-9;]*m/g, "")
      }
      if (name === "args") {
        let l = args
          .map((a, i) => {
            if (typeof a === "object")
              return `${inline ? "" : "\n"}${objFormat(a, {
                inline,
                depth,
                ansi,
              })}`
            else
              return ansi ? (i % 2 === 0 ? ansiFmt(a, ANSI_CODE.yellow) : a) : a
          })
          .join(" ")
        return ansi ? l : l.replaceAll(/\u001b\[[0-9;]*m/g, "")
      }
      //@ts-ignore
      return `%${name}%`
    })}\n`
    if (meta.level === "fatal") {
      return ansi ? ansiFmt(log, ANSI_CODE.red) : log
    }
    return log
  }
}
