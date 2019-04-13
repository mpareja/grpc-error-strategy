# grpc-error-strategy

A gRPC implementation of the [error strategy interface](#error-strategy-interface).

## ErrorStrategy Interface

```typescript
interface ErrorStrategy {
  badImplementation: (message: string, innerError?: Error): Error,
  badRequest: (message: string, innerError?: Error): Error,
  forbidden: (message: string, innerError?: Error): Error,
  notFound: (message: string, innerError?: Error): Error,
  notImplemented: (message: string, innerError?: Error): Error,
  preconditionFailed: (message: string, innerError?: Error): Error,
  unavailable: (message: string, innerError?: Error): Error,

  propagate: (message: string, innerError: Error, targetErrorStrategy: ErrorStrategy): Error
}
```

### Basic Error Creation

Here are some examples of how you might use this library:

```javascript
const { unavailable, badRequest } = require('grpc-error-strategy')

let thing
try {
  thing = createThing()
} catch (e) {
  throw badRequest('error creating thing', e)
}

try {
  save(thing)
} catch (e) {
  throw unavailable('error saving thing', e)
}
```

### Propagating Technology-Specific Error Metadata

It can be the case that the technology used to trigger some processing is not the same as technology used to trigger downstream processing. The `propagate` method allows one to take a gRPC error and generate an error using another ErrorStrategy implementation.

Consider an HTTP request handler that invokes a gRPC API. Say we would like to return the gRPC status code as an HTTP status code. Here's how you might accomplish this:

```javascript
const GrpcErrorStrategy = require('grpc-error-strategy')
const HttpErrorStrategy = require('http-error-strategy')

try {
  grpcRequestToSaveThing()
} catch (e) {
  // the following will return an equivalent HTTP error
  throw GrpcErrorStrategy.propagate('unable to save thing', e, HttpErrorStrategy)
}
```

## Usage Patterns to Consider

It may be wise to decouple your code from the technology used to trigger it (see [ports and adapters](http://wiki.c2.com/?PortsAndAdaptersArchitecture)). You may even want to support triggering your code in different ways - HTTP, gRPC, CLI.

Therefore, consider accepting ErrorStrategy instances instead of importing them directly to keep code agnostic of the triggering technology:

```javascript
// you might consider destructuring ErrorStrategy into the methods you need...
const anOperation = (ErrorStrategy) => (input) => {
  let thing
  try {
    thing = createThing()
  } catch (e) {
    throw ErrorStrategy.badRequest('error creating thing', e)
  }
}
```

If your code is triggering specific downstream technology, then importing the appropriate ErrorStrategy is reasonable:

```javascript
const { propagate } = require('grpc-error-strategy') // legit, you know it's gRPC your calling

const anOperation = (ErrorStrategy) => (input) => {
  try {
    grpcRequestToSaveThing()
  } catch (e) {
    // returns an error formatted as per the passed in ErrorStrategy
    throw propagate('unable to save thing', e, ErrorStrategy)
  }
}
```

## Release Management

GitHub Actions are used to run linting, tests and code coverage on git push. Tags are used to create releases. Once a release is created, an action will cause the npm package to published.
