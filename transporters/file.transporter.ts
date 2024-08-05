import type { Transporter } from "."

import { appendFile } from "fs/promises"

/**
 * Ouput logs to a file
 * @param config.path path of the file to write to
 * @param config.flag file system flag. Default is 'a'
 * @example
 * file({ path: "path/to/file.log" })
 */
export const file: (config: { path: string; flag?: string }) => Transporter =
  ({ path, flag }) =>
  (buffer) => {
    appendFile(path, buffer.join(""), { flag })
  }
