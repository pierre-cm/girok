# girok

[![Build & Test](https://github.com/pierre-cm/girok/actions/workflows/build_test.yml/badge.svg?branch=main)](https://github.com/pierre-cm/girok/actions/workflows/build_test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pierre-cm/girok/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/girok.svg)](https://www.npmjs.com/package/girok)

girok is a lightweight and highly customizable Javascript logger.

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

TODO
