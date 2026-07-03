import { IconCheckCircle } from './Icons'

export interface ChecklistItem {
  id: string
  label: string
  pattern: RegExp
}

interface SelfCheckProps {
  items: ChecklistItem[]
  content: string
}

export function SelfCheck({ items, content }: SelfCheckProps) {
  const results = items.map((item) => ({
    ...item,
    passed: item.pattern.test(content),
  }))
  const passed = results.filter((c) => c.passed).length
  const total = results.length

  return (
    <div className="card !p-5">
      <h3 className="text-sm font-semibold text-ink mb-4">
        Self-Check ({passed}/{total})
      </h3>
      <div className="space-y-3">
        {results.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            {item.passed ? (
              <IconCheckCircle size={14} className="mt-0.5 flex-shrink-0" />
            ) : (
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                className="mt-0.5 flex-shrink-0"
                fill="none"
                stroke="#cccccc"
                strokeWidth={1}
              >
                <circle cx={12} cy={12} r={11} />
              </svg>
            )}
            <span
              className={`text-xs leading-relaxed ${item.passed ? 'text-ink' : 'text-muted'}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
