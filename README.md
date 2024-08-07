# girok

[![Build & Test](https://github.com/pierre-cm/girok/actions/workflows/build_test.yml/badge.svg?branch=main)](https://github.com/pierre-cm/girok/actions/workflows/build_test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pierre-cm/girok/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/girok.svg)](https://www.npmjs.com/package/girok)

girok is a lightweight and highly customizable logger library.

## Install

Using npm:

```bash
npm install girok
```

Using bun:

```bash
bun add girok
```

## Usage

```js
import { logger } from "girok"
import { formatText } from "girok/formatters"

let log = logger({
  level: "info",
  formatter: formatText("[%lvl%] %ctx% %args%"),
  outputs: ["stdout", "file://./logs"],
})

log.info("Hello World!") // [INFO]  Hello World!

log = log.context({ key: "value" })

log.info("Hello again!") // [INFO] key="value" Hello again!
```

## Documentation

- [Basics](#basics)
  - [Instanciate a logger](#instanciate-a-logger)
  - [Level](#level)
  - [Context](#context)
- [Formatting](#formatting)
  - [Predefined formatters](#predefined-formatters)
  - [Custom formatters](#custom-formatters)
- [Outputs](#outputs)
- [Transporters](#transporters)
  - [stdout](#stdout)
  - [file](#file)
  - [http](#http)
  - [logstash](#logstash)
  - [splunk](#splunk)
- [Other options](#other-options)
  - [Buffer size](#buffer-size)
  - [Flush interval](#flush-interval)
  - [Override console](#override-console)

### Basics

#### Instanciate a logger

To instanciate a logger you can use the `logger` function:

```js
import { logger } from "girok"

const log = logger()

log.info("Hello World!")
```

#### Level

The `level` option allows you to set the minimum level that will be logged. By default, the `level` option is set to `info`.

```js
import { logger } from "girok"

const log = logger({
  level: "warn",
})

log.trace("trace") // Not printed
log.debug("debug") // Not printed
log.info("info") // Not printed
log.warn("warn") // prints "warn"
log.error("error") // prints "error"
log.fatal("fatal") // prints "fatal" and exit process
```

The following levels are available:

```
trace < debug < info < warn < error < fatal
```

#### Context

To add context properties to your logs, you can use the logger `context` function. This function takes a new contex in entry and returns a new logger with the defined context.

```js
import { logger } from "girok"

let log = logger()

log.info("Message without context") // [INFO] Message without context

log = log.context({ foo: "bar" })

log.info("Message with context") // [INFO] foo="bar" Message with context

log = log.context({ test: 42 })

log.info("Message with context") // [INFO] foo="bar", test=42 Message with context
```

### Formatting

#### Predefined formatters

You can use the `formatter` option to define the format of your logs.
There are two predefined formatters, `text` and `json`. The `text` formatter is the default one.

```js
import { logger } from "girok"

let logTxt = logger({ formatter: "text" })

let logJson = logger({ formatter: "json" })

logTxt.info("Hello World")
// [INFO] 1970-01-01 00:00:00.000 (index.ts:6:8)  Hello World

logJson.info("Hello World")
// {"level":"INFO","caller":"index.ts:7:9","ts":0,"message":"Hello World"}
```

#### Custom formatters

You can use the `formatter` option to define your own formatter function. Here is the signature of the formatter function:

```ts
type LogMeta = {
  level: Level
  caller?: string
  ts: number
  context: Record<string, any>
}
type Formatter = (meta: LogMeta, ...args: any[]) => string
```

There are two predefined formatters functions, `formatText` and `formatJson`. Those are the formatters used by the default `text` and `json` formatters, respectively.
Each of these can be customized.

```js
import { logger } from "girok"
import { formatText, formatJson } from "girok/formatters"

const logTxt = logger({
  formatter: formatText(), // alias for 'text'
})

const logJson = logger({
  formatter: formatJson(), // alias for 'json'
})
```

##### formatText()

Format log message as text.

Signature:

```ts
type FormatText = (
  fmt: string,
  meta: { ansi?: boolean; inline?: boolean; depth?: number | null }
) => Formatter
```

Example:

```js
let log = formatText("[%lvl%] %date% (%caller%) %args%", {
  depth: 4,
  ansi: false,
  inline: true,
})
log.info("Hello World!")
// [INFO] 2022-01-01 00:00:00.000 (index.js) Hello World!
log = formatText(
  "[%lvl%] %date.format(YYYY-MM-DD HH:mm:ss.SSS).utc% %ctx% %args%"
)
log.warn("Hello World!")
// [WARN] 2022-01-01 00:00:00.000  Hello World!
```

##### formatJson()

Format log as JSON object. Each argument is treated as a sequence of alternating keys and values. If there is only one argument passed, it gets the default "message" key.

Signature:

```ts
type FormatJson = (
  filter?: string[], // default is  ['level', 'caller', 'ts', 'context', 'args']
  opt?: { tsFormat?: string; utc?: boolean }
) => Formatter
```

Example:

```js
const log = formatJson(["level", "ts"])
log.info("key1", "val1", "key2", 42, "key3", { foo: "bar" })
// {"level":"info","ts":123456789,"key1":"val1","key2":42,"key3":{"foo":"bar"}}
log.info("Hey!")
// {"level":"info","ts":123456790,"message":"Hey!"}
```

### Outputs

The outputs option allows you to define a list of target outputs for your logs. The default output is `["stdout"]`.
Acceptable values are:

- `stdout` - write logs to standard output
- `file://<filePath>` - appends logs to a file located at `<filePath>`
- Transporter function - see next section for more details

```js
import { logger } from "girok"

const log = logger({
  outputs: ["stdout", "file://./logs"],
})
```

### Transporters

You can alson define a Transporter function as an output. This allows you to send logs to custom destinations.

The signature of a Transporter function is:

```ts
type Transporter = (buffer: string[]) => void
```

Girok provides the following default Transporter functions:

#### stdout

This is the default transporter. It writes logs to the standard output. This is the transporter used by the `"stdout"` alias.

```js
import { logger } from "girok"
import { stdout } from "girok/transporters"

const log = logger({
  outputs: [stdout], // same as ["stdout"]
})
```

#### file

This transporter write logs to a file. This is the transporter used by the `"file"` alias.

- `path` - path to the file
- `flag` - flag to open the file. The default is `"a"`, which means append.

```js
import { logger } from "girok"
import { file } from "girok/transporters"

const log = logger({
  outputs: [file({ path: "./logs", flag: "a" })], // same as ["file://./logs"]
})
```

#### http

This transporter sends logs to an HTTP server. By default the logs in the buffer are concatened and written in the body of the request. You can configure the `parser` option to parse the response before sending it.

Signature:

```ts
type HttpTransporter = (config: {
  url: string
  method?: string // default is POST
  headers?: Record<string, string>
  onError?: (error: any) => void
  parser?: (data: string[]) => any // tr
}) => Transporter
```

here is an example of using the http transporter:

```js
import { logger } from "girok"
import { http } from "girok/transporters"

const log = logger({
  outputs: [http({ url: "http://localhost:7357" })],
})
```

#### logstash

This transporter sends logs to a Logstash server.

Signature:

```ts
type LogstashTransporter = (config: {
  url?: string // default is http://localhost:5044
  onError?: (error: any) => void
})
```

Example:

```js
import { logger } from "girok"
import { logstash } from "girok/transporters"

const log = logger({
  outputs: [logstash()],
})
```

#### splunk

This transporter sends logs to a Splunk server.

Signature:

```ts
type SplunkTransporter = (config: {
  url?: string // default is http://localhost:8088/services/collector
  token?: string
  metadata?: {
    time?: number
    host?: string
    source?: string
    sourcetype?: string
    index?: string
  }
  onError?: (e: Error) => void
})
```

Example:

```js
import { logger } from "girok"
import { splunk } from "girok/transporters"

const log = logger({
  outputs: [splunk()],
})
```

### Other options

#### Buffer size

The `bufferSize` option defines the maximum number of logs in the buffer before flushing. The default is 1, which means logs will be flushed after each log.

```js
import { logger } from "girok"

const log = logger({
  bufferSize: 5,
})

log.info("1") // No output
log.info("2") // No output
log.info("3") // No output
log.info("4") // No output
log.info("5") // output: 1\n2\n3\n4\n5\n
```

#### Flush interval

The `flushInterval` option defines the interval in milliseconds between two flushes. The default is `undefined`. Meaning that logs will be flushed after each buffer completion.

```js
import { logger } from "girok"

const log = logger({
  flushInterval: 10_000, // logs are flushed every 10 seconds
})
```

#### Override console

The `overrideConsole` option defines whether the `console` object should be overridden by the current logger. The default is `false`.

```js
import { logger } from "girok"

const log = logger({
  overrideConsole: true,
})

console.log("Hello, World!") // alias for log.info("Hello World")
// [INFO] 1970-01-01 00:00:00.000 (index.ts:7:9)  Hello World!
console.warn("Test", 42)
// [WARN] 1970-01-01 00:00:00.000 (index.ts:9:9)  Test 42
```
