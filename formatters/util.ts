export const ANSI_CODE = {
  green: "38;2;120;180;1",
  red: "38;2;255;0;0",
  blue: "38;2;10;130;160",
  yellow: "38;2;200;154;10",
  pink: "38;2;180;0;90",
  cyan: "38;2;50;180;190",
  gray: "38;2;128;128;128",
  purple: "38;2;155;0;155",
}

export const LEVEL_ANSI = {
  trace: ANSI_CODE.gray,
  debug: ANSI_CODE.cyan,
  info: ANSI_CODE.green,
  warn: ANSI_CODE.yellow,
  error: ANSI_CODE.red,
}

export const ansiFmt = (str: string, code?: string, enabled: boolean = true) =>
  enabled && code ? `\x1b[${code}m${str}\x1b[0m` : str

export const objFormat = (
  obj: any,
  opt?: { inline?: boolean; depth: number | null; ansi: boolean },
  visited = new WeakSet(),
  d: number = 0
): string => {
  if (!opt || (opt?.depth !== null && d >= opt?.depth)) return "..."
  if (obj === null) return ansiFmt("null", ANSI_CODE.pink, opt.ansi)
  if (obj === undefined) return ansiFmt("undefined", ANSI_CODE.gray, opt.ansi)
  if (typeof obj === "object") {
    if (obj instanceof RegExp)
      return ansiFmt(obj.toString(), ANSI_CODE.purple, opt.ansi)
    visited.add(obj)
    const lf = opt.inline ? "" : "\n"
    if (Array.isArray(obj))
      return `[ ${obj.map((e) => objFormat(e, opt, visited, d)).join(", ")} ]`
    return `{ ${lf}${Object.entries(obj)
      .map(([k, v]) => {
        let val: any = v
        if (visited.has(val))
          val = ansiFmt("<circular>", ANSI_CODE.cyan, opt.ansi)
        else val = objFormat(v, opt, visited, d + 1)
        return `${opt.inline ? "" : " ".repeat((d + 1) * 2)}${ansiFmt(
          k,
          ANSI_CODE.yellow,
          opt.ansi
        )}: ${val}`
      })
      .join(`, ${lf}`)}${lf}${
      opt.inline ? " " : " ".repeat(Math.max(0, (d + 1) * 2 - 2))
    }}`
  }
  if (typeof obj === "string")
    return ansiFmt(`"${obj}"`, ANSI_CODE.green, opt.ansi)
  if (typeof obj === "number")
    return ansiFmt(obj.toString(), ANSI_CODE.blue, opt.ansi)
  if (typeof obj === "boolean")
    return ansiFmt(obj ? "true" : "false", ANSI_CODE.purple, opt.ansi)
  if (typeof obj === "function")
    return ansiFmt("<function>", ANSI_CODE.cyan, opt.ansi)
  if (typeof obj === "symbol")
    return ansiFmt(obj.toString(), ANSI_CODE.cyan, opt.ansi)

  return obj.toString()
}
