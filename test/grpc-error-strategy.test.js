const GrpcErrorStrategy = require('../')

const A_DESCRIPTION = 'my description'
const A_PARENT_DESCRIPTION = 'parent description'

// status codes: https://grpc.io/grpc/node/grpc.html
;[
  { code: 2, type: 'badImplementation' },
  { code: 3, type: 'badRequest' },
  { code: 5, type: 'notFound' },
  { code: 7, type: 'forbidden' },
  { code: 9, type: 'preconditionFailed' },
  { code: 12, type: 'notImplemented' },
  { code: 14, type: 'unavailable' }
].forEach(testError)

describe('propagate status information from inner gRPC errors', () => {
  const inner = GrpcErrorStrategy.unavailable(A_DESCRIPTION)
  const outer = GrpcErrorStrategy.propagate(A_PARENT_DESCRIPTION, inner, GrpcErrorStrategy)

  it('outer error has description', () => {
    expect(outer).toEqual(new Error(A_PARENT_DESCRIPTION))
  })

  it('outer error includes the inner status code', () => {
    expect(outer.code).toEqual(inner.code)
  })

  it('outer error includes the inner error', () => {
    expect(outer.inner).toBe(inner)
  })

  describe('when propagating gRPC errors to other error strategies', () => {
    const TargetErrorStrategy = {
      unavailable: (msg, inner) => {
        const error = new Error(msg)
        error.inner = inner
        error.otherStatusField = 'UNAVAILABLE'
        return error
      }
    }
    const grpcError = GrpcErrorStrategy.unavailable(A_DESCRIPTION)
    const targetError = GrpcErrorStrategy.propagate(A_PARENT_DESCRIPTION, grpcError, TargetErrorStrategy)

    it('outer error has description', () => {
      expect(targetError).toEqual(new Error(A_PARENT_DESCRIPTION))
    })

    it('outer error does NOT include the gRPC status code field', () => {
      expect(targetError.code).toBe(undefined)
    })

    it('outer error includes the target strategy\'s error details', () => {
      expect(targetError.otherStatusField).toBe('UNAVAILABLE')
    })

    it('outer error includes the inner error', () => {
      expect(targetError.inner).toBe(grpcError)
    })
  })

  it('propagates non-gRPC errors without specifying a status code', () => {
    const nonGrpcError = new Error(A_DESCRIPTION)
    const outer = GrpcErrorStrategy.propagate(A_PARENT_DESCRIPTION, nonGrpcError, GrpcErrorStrategy)

    expect(outer).toEqual(new Error(A_PARENT_DESCRIPTION))
  })
})

function testError ({ type, code }) {
  describe(type, () => {
    it('has description', () => {
      const error = GrpcErrorStrategy[type](A_DESCRIPTION)
      expect(error).toEqual(new Error(A_DESCRIPTION))
    })

    it(`has a status code of ${code}`, () => {
      const error = GrpcErrorStrategy[type]()
      expect(error.code).toBe(code)
    })

    it('includes inner error', () => {
      const inner = new Error('bogus')
      const error = GrpcErrorStrategy[type](A_DESCRIPTION, inner)
      expect(error.inner).toBe(inner)
    })
  })
}
