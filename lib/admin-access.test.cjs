const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks, env = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, {
    exports, process: { env },
    require: (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name === 'node:crypto' || name === 'zod') return require(name)
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return exports
}

test('admin session rejects invalid codes, tampering, expiry and secret rotation', async () => {
  const env = { ADMIN_MATCH_ENTRY_SECRET: 'test-only-secret', NODE_ENV: 'production' }
  let cookie
  let options
  const access = load('lib/admin-access.ts', {
    'server-only': {},
    'next/headers': { cookies: async () => ({
      get: () => cookie ? { value: cookie } : undefined,
      set: (_name, value, opts) => { cookie = value; options = opts },
    }) },
  }, env)
  assert.equal(await access.hasAdminAccess(), false)
  assert.equal(await access.unlockAdminAccess('wrong'), false)
  assert.equal(cookie, undefined)
  assert.equal(await access.unlockAdminAccess(env.ADMIN_MATCH_ENTRY_SECRET), true)
  assert.equal(await access.hasAdminAccess(), true)
  assert.equal(cookie.includes(env.ADMIN_MATCH_ENTRY_SECRET), false)
  assert.equal(options.httpOnly, true)
  assert.equal(options.secure, true)
  assert.equal(options.sameSite, 'strict')
  assert.equal(options.path, '/admin')
  const valid = cookie
  cookie = valid.slice(0, -1) + (valid.endsWith('0') ? '1' : '0')
  assert.equal(await access.hasAdminAccess(), false)
  const payload = `1.${'a'.repeat(32)}`
  cookie = `${payload}.${require('node:crypto').createHmac('sha256', env.ADMIN_MATCH_ENTRY_SECRET).update(`admin-match-session:${payload}`).digest('hex')}`
  assert.equal(await access.hasAdminAccess(), false)
  cookie = valid
  env.ADMIN_MATCH_ENTRY_SECRET = 'rotated-secret'
  assert.equal(await access.hasAdminAccess(), false)
  delete env.ADMIN_MATCH_ENTRY_SECRET
  assert.equal(await access.hasAdminAccess(), false)
  assert.equal(await access.unlockAdminAccess(''), false)
})

test('all privileged actions reject unauthenticated calls before database access', async () => {
  let databaseCalls = 0
  const actions = load('app/admin/match-results/actions.ts', {
    '@/lib/admin-access': { hasAdminAccess: async () => false },
    '@/lib/supabase/admin': { createServiceRoleClient: () => { databaseCalls++; throw new Error('Database must not be reached') } },
    '@/lib/queries': {},
    'next/cache': {},
  })
  assert.equal((await actions.submitBulkMatchResults({}, null)).ok, false)
  assert.equal(await actions.getExistingMatchScoresAction('', 1, '', ''), null)
  assert.equal((await actions.closeSeasonAction('')).success, false)
  assert.equal((await actions.reopenSeasonAction('')).success, false)
  assert.equal(databaseCalls, 0)
})
