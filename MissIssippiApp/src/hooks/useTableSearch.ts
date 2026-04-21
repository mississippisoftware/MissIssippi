import { useState, useMemo } from 'react'

type FieldPath = string

interface UseTableSearchOptions {
  fields: FieldPath[]
  debounceMs?: number
}

function getFieldValue(obj: any, path: string): string[] {
  if (path.includes('[]')) {
    const [arrayField, ...rest] = path.split('[].')
    const arr = obj[arrayField]
    if (!Array.isArray(arr)) return []
    return arr.flatMap((item: any) =>
      rest.length ? getFieldValue(item, rest.join('[].')) : [String(item ?? '')]
    )
  }
  const parts = path.split('.')
  let value = obj
  for (const part of parts) {
    value = value?.[part]
  }
  return [String(value ?? '')]
}

export function useTableSearch<T>(items: T[], options: UseTableSearchOptions) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(item =>
      options.fields.some(field =>
        getFieldValue(item, field).some(val =>
          val.toLowerCase().includes(q)
        )
      )
    )
  }, [items, query, options.fields])

  const clear = () => setQuery('')

  return { filtered, query, setQuery, clear, resultCount: filtered.length }
}
