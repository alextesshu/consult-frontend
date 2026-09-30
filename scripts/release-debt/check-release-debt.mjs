#!/usr/bin/env node

import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const contractPattern = /<!--\s*release-debt-contract-v1\s*\n([\s\S]*?)\n-->/
const canonicalUtcPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/
const statuses = new Set([
  'STAGED_READY',
  'DEFERRED',
  'RELEASED',
  'DEV_ONLY',
  'MAIN_ONLY',
  'AMBIGUOUS',
])
const historicalStatuses = new Set(['RELEASED', 'DEV_ONLY', 'MAIN_ONLY', 'AMBIGUOUS'])

const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

function parseUtc(value, field) {
  const match = typeof value === 'string' ? canonicalUtcPattern.exec(value) : null
  if (!match) {
    throw new Error(`${field} must use canonical UTC ISO 8601 YYYY-MM-DDTHH:MM:SS[.fraction]Z`)
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number)
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    throw new Error(`${field} is not a valid calendar timestamp`)
  }
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day < 1 || day > daysInMonth[month - 1]) {
    throw new Error(`${field} is not a valid calendar timestamp`)
  }
  const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3))
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, milliseconds)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    throw new Error(`${field} is not a valid calendar timestamp`)
  }
  return date
}

export function loadContract(path) {
  const match = contractPattern.exec(fs.readFileSync(path, 'utf8'))
  if (!match) throw new Error('missing release-debt-contract-v1 block')
  const contract = JSON.parse(match[1])
  if (!contract || Array.isArray(contract)) {
    throw new Error('release-debt contract must be a JSON object')
  }
  return contract
}

export function validateContract(contract, now) {
  const findings = []
  const add = (code, record, message, { severity = 'ERROR', category = 'STRUCTURE' } = {}) => {
    findings.push({ severity, code, record, message, category })
  }
  if (contract.schema_version !== 1) {
    add('schema_version', 'contract', 'expected schema_version=1')
    return findings
  }
  if (!Array.isArray(contract.records)) {
    add('records', 'contract', 'records must be a list')
    return findings
  }

  contract.records.forEach((record, index) => {
    const name = nonempty(record?.ticket) ? record.ticket : `record[${index}]`
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      add('record_type', name, 'must be an object')
      return
    }
    for (const field of ['id', 'ticket', 'repository']) {
      if (!nonempty(record[field])) add('record_field', name, `requires non-empty ${field}`)
    }

    const { status } = record
    if (!statuses.has(status)) {
      add('status', name, 'is not a supported release status')
      return
    }

    let historical = record.historical_evidence
    if (typeof historical !== 'boolean') {
      add('historical_flag', name, 'requires boolean historical_evidence')
      historical = false
    }
    if (historical) {
      if (!historicalStatuses.has(status)) {
        add('historical_active_status', name, 'historical_evidence is forbidden for STAGED_READY and DEFERRED')
      }
      if (!nonempty(record.historical_reason)) {
        add('historical_reason', name, 'historical_evidence requires historical_reason')
      }
      try {
        parseUtc(record.evidence_snapshot_at, 'evidence_snapshot_at')
      } catch (error) {
        add('historical_snapshot', name, error.message)
      }
    } else {
      if (record.historical_reason !== null && record.historical_reason !== undefined) {
        add('historical_metadata', name, 'historical metadata requires historical_evidence=true')
      }
      if (record.evidence_snapshot_at !== null && record.evidence_snapshot_at !== undefined) {
        add('historical_metadata', name, 'historical metadata requires historical_evidence=true')
      }
      if (status === 'AMBIGUOUS') {
        add(
          'ambiguous_requires_historical',
          name,
          'AMBIGUOUS is reserved for an explicit review-controlled historical exception',
        )
      }
    }

    const staging = record.staging && typeof record.staging === 'object' && !Array.isArray(record.staging)
      ? record.staging
      : {}
    if (staging !== record.staging) add('staging', name, 'must be an object')
    let accepted = null
    if (staging.acceptance_completed_at !== null && staging.acceptance_completed_at !== undefined) {
      try {
        accepted = parseUtc(staging.acceptance_completed_at, 'staging.acceptance_completed_at')
      } catch (error) {
        add('staging_timestamp', name, error.message)
      }
    }
    if (['STAGED_READY', 'DEFERRED'].includes(status) && !accepted) {
      add('missing_staging_acceptance_timestamp', name, 'requires the recorded UTC completion time of full staging acceptance')
    }

    const production = record.production && typeof record.production === 'object' && !Array.isArray(record.production)
      ? record.production
      : {}
    if (production !== record.production) add('production', name, 'must be an object')
    if (status === 'RELEASED') {
      if (!nonempty(production.deployed_source_sha)) add('released_sha', name, 'requires deployed_source_sha')
      if (!nonempty(production.runtime_evidence)) add('released_runtime', name, 'requires runtime_evidence')
    }

    const decision = record.decision && typeof record.decision === 'object' && !Array.isArray(record.decision)
      ? record.decision
      : {}
    if (decision !== record.decision) add('decision', name, 'must be an object')
    if (status === 'DEFERRED') {
      if (!nonempty(record.release_owner)) add('defer_owner', name, 'requires release_owner')
      if (decision.kind !== 'DEFER') add('defer_kind', name, 'requires decision.kind=DEFER')
      if (!nonempty(decision.reason)) add('defer_reason', name, 'requires a reason')
      for (const [field, code] of [['at', 'defer_timestamp'], ['next_review_at', 'defer_review']]) {
        try {
          const timestamp = parseUtc(decision[field], `decision.${field}`)
          if (field === 'next_review_at' && timestamp < now) {
            add('defer_review_overdue', name, 'next review is overdue', { category: 'POLICY' })
          }
        } catch (error) {
          add(code, name, error.message)
        }
      }
    }

    if (status === 'STAGED_READY' && accepted) {
      const ageHours = (now.valueOf() - accepted.valueOf()) / 3_600_000
      if (ageHours < 0) {
        add('staging_timestamp_future', name, 'acceptance time is in the future', { category: 'POLICY' })
      } else if (ageHours > 72) {
        add('staged_ready_overdue', name, 'is older than 72 hours', { category: 'POLICY' })
      } else if (ageHours > 24) {
        add('staged_ready_lag', name, 'is older than 24 hours', { severity: 'WARNING', category: 'POLICY' })
      }
    }
  })
  return findings
}

export function contractExitCode(findings) {
  const errors = findings.filter((finding) => finding.severity === 'ERROR')
  if (errors.some((finding) => finding.category === 'STRUCTURE')) return 2
  return errors.length ? 1 : 0
}

export function main(argv) {
  const [path, ...options] = argv
  const nowOption = options.indexOf('--now')
  try {
    const now = nowOption >= 0 ? parseUtc(options[nowOption + 1], '--now') : new Date()
    const findings = validateContract(loadContract(path), now)
    findings.forEach((finding) => console.log(`${finding.severity} [${finding.code}] ${finding.record}: ${finding.message}`))
    const errors = findings.filter((finding) => finding.severity === 'ERROR').length
    const warnings = findings.filter((finding) => finding.severity === 'WARNING').length
    console.log(`release-debt validation: ${errors} error(s), ${warnings} warning(s)`)
    return contractExitCode(findings)
  } catch (error) {
    console.error(`ERROR [contract] ${error.message}`)
    return 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
