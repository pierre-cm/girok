import { http } from "."
/**
 * Logstash Transporter
 *
 * @param config.url - The URL for the Logstash endpoint. Defaults to "http://localhost:5044".
 *
 * @example
 * ```ts
 * const transporter = logstash({
 *   url: "http://localhost:5044"
 * })
 * ```
 */
export const logstash = (config?: {
  url?: string
  onError?: (error: any) => void
}) =>
  http({
    url: config?.url || "http://localhost:5044",
    headers: { "Content-Type": "application/json" },
    parser: (d) => `[${d.join(",")}]`,
    onError: config?.onError,
  })
