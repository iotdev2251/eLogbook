import {
    QUERY_FIELDS,
    validateOrderDir,
    validateOrderField,
} from './history-query-builder.js'

const HEADER_RE = /^select\s+\*\s+from\s+history\b/i

function stripQuotes(value) {
    const trimmed = value.trim()
    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
        || (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
        return trimmed.slice(1, -1).replace(/''/g, "'")
    }
    return trimmed
}

function parseScalarValue(raw) {
    const text = raw.trim()
    if (!text) {
        throw new Error('Missing value in condition')
    }

    if (text.startsWith("'") || text.startsWith('"')) {
        return stripQuotes(text)
    }

    if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text)
    }

    return text
}

function parseInList(raw) {
    const inner = raw.trim()
    if (!inner.startsWith('(') || !inner.endsWith(')')) {
        throw new Error('IN operator requires a parenthesized list')
    }
    const body = inner.slice(1, -1).trim()
    if (!body) {
        throw new Error('IN list cannot be empty')
    }

    const values = []
    let current = ''
    let inQuote = null

    for (let i = 0; i < body.length; i += 1) {
        const ch = body[i]
        if (inQuote) {
            if (ch === inQuote && body[i + 1] === inQuote) {
                current += ch
                i += 1
            } else if (ch === inQuote) {
                inQuote = null
            } else {
                current += ch
            }
            continue
        }

        if (ch === "'" || ch === '"') {
            inQuote = ch
            continue
        }

        if (ch === ',') {
            values.push(parseScalarValue(current))
            current = ''
            continue
        }

        current += ch
    }

    if (inQuote) {
        throw new Error('Unclosed quote in IN list')
    }

    if (current.trim()) {
        values.push(parseScalarValue(current))
    }

    return values
}

function splitTopLevelAnd(clause) {
    const parts = []
    let current = ''
    let depth = 0
    let inQuote = null
    const lower = clause.toLowerCase()

    for (let i = 0; i < clause.length; i += 1) {
        const ch = clause[i]

        if (inQuote) {
            current += ch
            if (ch === inQuote && clause[i + 1] === inQuote) {
                current += clause[i + 1]
                i += 1
            } else if (ch === inQuote) {
                inQuote = null
            }
            continue
        }

        if (ch === "'" || ch === '"') {
            inQuote = ch
            current += ch
            continue
        }

        if (ch === '(') {
            depth += 1
            current += ch
            continue
        }

        if (ch === ')') {
            depth -= 1
            current += ch
            continue
        }

        if (depth === 0 && lower.startsWith(' and ', i)) {
            parts.push(current.trim())
            current = ''
            i += 4
            continue
        }

        current += ch
    }

    if (current.trim()) {
        parts.push(current.trim())
    }

    return parts
}

function parseCondition(segment) {
    const trimmed = segment.trim().replace(/^\(|\)$/g, '').trim()
    const inMatch = trimmed.match(/^([a-z_]+)\s+in\s+(.+)$/i)
    if (inMatch) {
        const field = inMatch[1].toLowerCase()
        if (!QUERY_FIELDS[field]) {
            throw new Error(`Unknown field: ${field}`)
        }
        return { field, op: 'in', value: parseInList(inMatch[2]) }
    }

    const notLikeMatch = trimmed.match(/^([a-z_]+)\s+not\s+like\s+(.+)$/i)
    if (notLikeMatch) {
        const field = notLikeMatch[1].toLowerCase()
        if (!QUERY_FIELDS[field]) {
            throw new Error(`Unknown field: ${field}`)
        }
        return { field, op: 'not_like', value: stripQuotes(notLikeMatch[2]) }
    }

    const likeMatch = trimmed.match(/^([a-z_]+)\s+like\s+(.+)$/i)
    if (likeMatch) {
        const field = likeMatch[1].toLowerCase()
        if (!QUERY_FIELDS[field]) {
            throw new Error(`Unknown field: ${field}`)
        }
        return { field, op: 'like', value: stripQuotes(likeMatch[2]) }
    }

    const cmpMatch = trimmed.match(/^([a-z_]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/i)
    if (!cmpMatch) {
        throw new Error(`Could not parse condition: ${segment}`)
    }

    const field = cmpMatch[1].toLowerCase()
    if (!QUERY_FIELDS[field]) {
        throw new Error(`Unknown field: ${field}`)
    }

    return {
        field,
        op: cmpMatch[2].toLowerCase(),
        value: parseScalarValue(cmpMatch[3]),
    }
}

function parseHistoryQuerySql(sql) {
    const normalized = String(sql || '').trim().replace(/\s+/g, ' ')
    if (!normalized) {
        throw new Error('Query is empty')
    }

    const headerMatch = normalized.match(HEADER_RE)
    if (!headerMatch) {
        throw new Error('Only SELECT * FROM history is supported')
    }

    let rest = normalized.slice(headerMatch[0].length).trim()

    const filters = []
    let orderBy = 'report_at'
    let orderDir = 'desc'
    let limit = 300
    let offset = 0

    const whereMatch = rest.match(/\bwhere\s+(.+?)(?=\s+order\s+by\b|\s+limit\b|\s+offset\b|$)/i)
    if (whereMatch) {
        const segments = splitTopLevelAnd(whereMatch[1])
        segments.forEach((segment) => {
            filters.push(parseCondition(segment))
        })
        rest = rest.replace(whereMatch[0], '').trim()
    }

    const orderMatch = rest.match(/\border\s+by\s+([a-z_]+)(?:\s+(asc|desc))?\b/i)
    if (orderMatch) {
        orderBy = validateOrderField(orderMatch[1])
        orderDir = validateOrderDir(orderMatch[2] || 'desc')
        rest = rest.replace(orderMatch[0], '').trim()
    }

    const limitMatch = rest.match(/\blimit\s+(\d+)\b/i)
    if (limitMatch) {
        limit = parseInt(limitMatch[1], 10)
        rest = rest.replace(limitMatch[0], '').trim()
    }

    const offsetMatch = rest.match(/\boffset\s+(\d+)\b/i)
    if (offsetMatch) {
        offset = parseInt(offsetMatch[1], 10)
        rest = rest.replace(offsetMatch[0], '').trim()
    }

    if (rest.length > 0) {
        throw new Error(`Unexpected SQL fragment: ${rest}`)
    }

    return { filters, orderBy, orderDir, limit, offset }
}

export { parseHistoryQuerySql }
