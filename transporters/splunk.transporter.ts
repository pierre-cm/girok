import { http } from "."

/**
 * Splunk Transporter
 * @param config.url Splunk server url
 * @param config.token hec token
 * @param config.metadata Splunk event metadata
 *
 * @example
 * const transporter = splunk({ url: "http://localhost:8088/services/collector", token: "token" })
 */
export const splunk = (config: {
  url?: string
  token?: string
  metadata?: {
    time?: number
    host?: string
    source?: string
    sourcetype?: string
    index?: string
  }
  onError?: (e: Error) => void
}) =>
  http({
    url: config?.url || "http://localhost:8088/services/collector",
    headers: {
      "Content-Type": "application/json",
      ...(config?.token ? { Authorization: `Splunk ${config.token}` } : {}),
    },
    parser: (d) =>
      `[${d
        .map((b) => {
          return JSON.stringify({
            ...(config?.metadata || {}),
            event: JSON.parse(b),
          })
        })
        .join(",")}]`,
    onError: config?.onError,
  })
