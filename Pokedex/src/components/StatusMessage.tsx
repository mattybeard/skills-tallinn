interface StatusMessageProps {
  title: string
  message: string
  onRetry?: () => void
  tone?: 'error' | 'info'
}

export function StatusMessage({ title, message, onRetry, tone = 'info' }: StatusMessageProps) {
  return (
    <div className={`status status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
