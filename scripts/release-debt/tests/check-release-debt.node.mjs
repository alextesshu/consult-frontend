import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { validateContract } from '../check-release-debt.mjs'

const now = new Date('2026-09-29T12:00:00.000Z')
const nowText = '2026-09-29T12:00:00Z'
const historicalSnapshot = '2026-09-29T11:03:00Z'
const validator = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../check-release-debt.mjs')

function record(status = 'STAGED_READY', acceptanceCompletedAt = '2026-09-28T13:00:00Z') {
  return {
    id: 'kan-test',
    ticket: 'KAN-test',
    repository: 'consult-frontend',
    status,
    historical_evidence: false,
    historical_reason: null,
    evidence_snapshot_at: null,
    staging: { sha: 'abc', acceptance_completed_at: acceptanceCompletedAt },
    release_owner: null,
    decision: { kind: null, at: null, reason: null, next_review_at: null },
    production: { deployed_source_sha: null, runtime_evidence: null },
  }
}

function contract(entry) {
  return { schema_version: 1, records: [entry] }
}

function codes(entry) {
  return new Set(validateContract(contract(entry), now).map(({ code }) => code))
}

function isoBefore(hours) {
  return new Date(now.valueOf() - hours * 3_600_000).toISOString().replace('.000Z', 'Z')
}

function validDeferred() {
  const entry = record('DEFERRED', isoBefore(1))
  entry.release_owner = 'release-owner'
  entry.decision = {
    kind: 'DEFER',
    at: isoBefore(1),
    reason: 'Approved deferral',
    next_review_at: '2026-09-29T13:00:00Z',
  }
  return entry
}

function validReleased() {
  const entry = record('RELEASED', null)
  entry.production = { deployed_source_sha: 'abc123', runtime_evidence: 'Production runtime verified' }
  return entry
}

function historicalAmbiguous() {
  const entry = record('AMBIGUOUS', null)
  entry.historical_evidence = true
  entry.historical_reason = 'Imported from the reviewed Phase A snapshot'
  entry.evidence_snapshot_at = historicalSnapshot
  return entry
}

function cliResult(payload) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-debt-'))
  try {
    const register = path.join(directory, 'register.md')
    fs.writeFileSync(register, `# Register\n\n<!-- release-debt-contract-v1\n${payload}\n-->\n`, 'utf8')
    return spawnSync(process.execPath, [validator, register, '--now', nowText], {
      encoding: 'utf8',
    }).status
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('staged-ready at 23 hours is clean', () => {
  assert.deepEqual(codes(record('STAGED_READY', isoBefore(23))), new Set())
})

test('staged-ready at exactly 24 hours is clean', () => {
  assert.deepEqual(codes(record('STAGED_READY', isoBefore(24))), new Set())
})

test('staged-ready at 25 hours warns', () => {
  assert.deepEqual(codes(record('STAGED_READY', isoBefore(25))), new Set(['staged_ready_lag']))
})

test('staged-ready at exactly 72 hours warns', () => {
  assert.deepEqual(codes(record('STAGED_READY', isoBefore(72))), new Set(['staged_ready_lag']))
})

test('staged-ready at 73 hours errors', () => {
  assert.deepEqual(codes(record('STAGED_READY', isoBefore(73))), new Set(['staged_ready_overdue']))
})

test('future acceptance timestamp errors', () => {
  assert.deepEqual(codes(record('STAGED_READY', '2026-09-29T12:00:01Z')), new Set(['staging_timestamp_future']))
})

test('invalid calendar timestamp is malformed', () => {
  assert.deepEqual(
    codes(record('STAGED_READY', '2026-02-30T00:00:00Z')),
    new Set(['staging_timestamp', 'missing_staging_acceptance_timestamp']),
  )
})

test('noncanonical UTC offset is malformed', () => {
  assert.deepEqual(
    codes(record('STAGED_READY', '2026-09-28T13:00:00+00:00')),
    new Set(['staging_timestamp', 'missing_staging_acceptance_timestamp']),
  )
})

test('fractional canonical UTC timestamp is valid', () => {
  assert.deepEqual(codes(record('STAGED_READY', '2026-09-28T13:00:00.123456Z')), new Set())
})

test('missing acceptance timestamp is not replaced', () => {
  assert.deepEqual(
    codes(record('STAGED_READY', null)),
    new Set(['missing_staging_acceptance_timestamp']),
  )
})

test('invalid defer decision timestamp is malformed', () => {
  const entry = validDeferred()
  entry.decision.at = '2026-02-30T00:00:00Z'
  assert.deepEqual(codes(entry), new Set(['defer_timestamp']))
})

test('deferred requires all fields', () => {
  assert.deepEqual(
    codes(record('DEFERRED', isoBefore(1))),
    new Set(['defer_owner', 'defer_kind', 'defer_reason', 'defer_timestamp', 'defer_review']),
  )
})

test('deferred overdue review errors', () => {
  const entry = validDeferred()
  entry.decision.next_review_at = isoBefore(1)
  assert.deepEqual(codes(entry), new Set(['defer_review_overdue']))
})

test('released requires deployed SHA', () => {
  const entry = validReleased()
  entry.production.deployed_source_sha = null
  assert.deepEqual(codes(entry), new Set(['released_sha']))
})

test('released requires runtime evidence', () => {
  const entry = validReleased()
  entry.production.runtime_evidence = null
  assert.deepEqual(codes(entry), new Set(['released_runtime']))
})

test('unknown status is malformed', () => {
  assert.deepEqual(codes(record('UNKNOWN')), new Set(['status']))
})

test('malformed JSON returns exit code 2', () => {
  assert.equal(cliResult('{not-json'), 2)
})

test('historical AMBIGUOUS valid exception', () => {
  assert.deepEqual(codes(historicalAmbiguous()), new Set())
})

test('nonhistorical AMBIGUOUS record is invalid', () => {
  assert.deepEqual(
    codes(record('AMBIGUOUS', null)),
    new Set(['ambiguous_requires_historical']),
  )
})

test('historical exception requires reason and snapshot', () => {
  const entry = historicalAmbiguous()
  entry.historical_reason = null
  entry.evidence_snapshot_at = null
  assert.deepEqual(codes(entry), new Set(['historical_reason', 'historical_snapshot']))
})

test('historical evidence is forbidden on staged-ready', () => {
  const entry = record('STAGED_READY', isoBefore(1))
  entry.historical_evidence = true
  entry.historical_reason = 'Not allowed for active release debt'
  entry.evidence_snapshot_at = historicalSnapshot
  assert.deepEqual(codes(entry), new Set(['historical_active_status']))
})

test('CLI returns 0 when only warning exists', () => {
  assert.equal(cliResult(JSON.stringify(contract(record('STAGED_READY', isoBefore(25))))), 0)
})

test('CLI returns 1 for actionable policy error', () => {
  assert.equal(cliResult(JSON.stringify(contract(record('STAGED_READY', isoBefore(73))))), 1)
})

test('CLI returns 2 for structural error', () => {
  assert.equal(cliResult(JSON.stringify(contract(record('UNKNOWN')))), 2)
})
