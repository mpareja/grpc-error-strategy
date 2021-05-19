// Hard-code the GRPC statuses so we don't need to import `grpc` module.
// We do, however, _test_ these values using the `grpc` module.
// status codes: https://grpc.io/grpc/node/grpc.html#.status__anchor
const errors = [
  { code: 2, type: 'badImplementation' },
  { code: 3, type: 'badRequest' },
  { code: 5, type: 'notFound' },
  { code: 7, type: 'forbidden' },
  { code: 9, type: 'preconditionFailed' },
  { code: 12, type: 'notImplemented' },
  { code: 14, type: 'unavailable' }
]

const errorsByCode = errors.reduce((acc, current) => {
  acc[current.code] = current.type
  return acc
}, {})

for (const { type, code } of errors) {
  module.exports[type] = (msg, inner) => {
    const error = new Error(msg)
    error.code = code
    if (inner) {
      error.inner = inner
    }
    return error
  }
}

module.exports.propagate = (msg, inner, targetStrategy) => {
  const type = errorsByCode[inner.code]
  const func = targetStrategy[type]
  return func ? func(msg, inner) : module.exports.badImplementation(msg, inner)
}
