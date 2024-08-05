export type Transporter = (buffer: string[]) => void

export * from "./stdout.transporter"
export * from "./file.transporter"
export * from "./http.transporter"

export * from "./logstash.transporter"
export * from "./splunk.transporter"
