import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = (await readFile(new URL('../lib/builder-access.ts', import.meta.url), 'utf8')).replace("import 'server-only'", '')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { assertBuilderAccess } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
const previous = process.env.NODE_ENV
process.env.NODE_ENV = 'development'
test.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous })
const request = (host, origin, extra = {}, url = 'http://127.0.0.1:3000/api/builder/products') => new Request(url, { method: 'POST', headers: { host, ...(origin === undefined ? {} : { origin }), ...extra } })

test('accepts the browser Host when Next uses a different internal hostname', () => {
  assert.doesNotThrow(() => assertBuilderAccess(request('localhost:3000', 'http://localhost:3000')))
  assert.doesNotThrow(() => assertBuilderAccess(request('127.0.0.1:3000', 'http://127.0.0.1:3000', {}, 'http://localhost:3000/api/builder/products')))
  assert.doesNotThrow(() => assertBuilderAccess(request('localhost:3001', 'http://localhost:3001', {}, 'http://0.0.0.0:3001/api/builder/products')))
  assert.doesNotThrow(() => assertBuilderAccess(request('[::1]:3000', 'http://[::1]:3000')))
})
test('still rejects different origins, schemes, ports, and missing origins', () => {
  for (const origin of ['http://127.0.0.1:3000', 'http://localhost:3001', 'https://localhost:3000', 'https://example.com', 'null', undefined]) {
    assert.throws(() => assertBuilderAccess(request('localhost:3000', origin)), /same-origin/)
  }
})
test('rejects cross-site requests even if origin and host match', () => {
  assert.throws(() => assertBuilderAccess(request('localhost:3000', 'http://localhost:3000', { 'sec-fetch-site': 'cross-site' })), /Cross-site/)
})
test('rejects non-loopback or malformed host headers and ignores forwarded headers', () => {
  for (const host of ['example.com', 'localhost.evil.com', 'localhost:3000@evil.com', 'localhost:3000/path']) {
    assert.throws(() => assertBuilderAccess(request(host, `http://${host}`)), /loopback/)
  }
  assert.throws(() => assertBuilderAccess(request('localhost:3000', 'https://example.com', { 'x-forwarded-host': 'example.com', 'x-forwarded-proto': 'https' })), /same-origin/)
})
test('GET works without Origin; requests without Host fall back to their own URL', () => {
  assert.doesNotThrow(() => assertBuilderAccess(new Request('http://localhost:3000/api/builder/pages')))
  assert.doesNotThrow(() => assertBuilderAccess(new Request('http://localhost:3000/api/builder/products', { method: 'POST', headers: { origin: 'http://localhost:3000' } })))
})
test('production access remains disabled', () => {
  process.env.NODE_ENV = 'production'
  try { assert.throws(() => assertBuilderAccess(request('localhost:3000', 'http://localhost:3000')), /local development only/) }
  finally { process.env.NODE_ENV = 'development' }
})
