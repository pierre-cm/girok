import type { Transporter } from "."

/**
 * Ouput logs to standard output
 */
export const stdout: Transporter = (buffer) => {
  process.stdout.write(buffer.join(""))
}
