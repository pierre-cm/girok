import type { Transporter } from "."

/**
 * Send logs over HTTP
 * @param config.url URL of the server
 * @param config.method HTTP method. Default is POST
 * @param config.headers HTTP headers
 * @param config.onError Error handler
 * @example
 * http({ url: "http://localhost:9200", headers: { "Authorization": "Bearer token" } })
 */
export const http: (config: {
  url: string
  method?: string
  headers?: Record<string, string>
  onError?: (error: any) => void
  parser?: (data: string[]) => any
}) => Transporter =
  ({ url, method, headers, onError, parser }) =>
  (buffer) => {
    let body = parser ? parser(buffer) : buffer.join("")
    fetch(url, {
      method: method || "POST",
      headers: headers ?? {},
      body,
    })
      .then(async (resp) => {
        if (onError && resp.status >= 400) onError(resp)
      })
      .catch(onError ?? (() => {}))
  }
