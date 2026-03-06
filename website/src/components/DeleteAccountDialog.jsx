import React from 'react'

export default function DeleteAccountDialog({
  accountEmail,
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
  error = '',
}) {
  const [phrase, setPhrase] = React.useState('')
  const confirmationPhrase = accountEmail || 'DELETE ACCOUNT'
  const isValid = phrase.trim() === confirmationPhrase

  React.useEffect(() => {
    if (!isOpen) {
      setPhrase('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>Account endgültig löschen</h2>
        <p>
          Diese Aktion löscht das komplette Konto, alle Gemeinden, Benutzer, Sensoren und
          Sensordaten dauerhaft. Der Vorgang kann <strong>nicht</strong> rückgängig gemacht werden.
        </p>
        <p>
          Zur Bestätigung gib bitte die E-Mail des Accounts ein:{' '}
          <code className="mono">{confirmationPhrase}</code>
        </p>

        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={confirmationPhrase}
          disabled={isLoading}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </button>
          <button
            type="button"
            className="danger"
            onClick={onConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Lösche...' : 'Endgültig löschen'}
          </button>
        </div>
      </div>
    </div>
  )
}
