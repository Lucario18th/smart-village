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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
    >
      <div className="modal-card delete-account-dialog">
        <h2 id="delete-account-title">Konto endgültig löschen</h2>

        <p id="delete-account-description" className="delete-account-lead">
          Diese Aktion entfernt Konto und zugehörige Daten dauerhaft.
        </p>

        <div className="delete-account-warning" role="note" aria-label="Warnhinweis">
          <strong>Achtung:</strong> Der Vorgang kann nicht rückgängig gemacht werden.
        </div>

        <p className="delete-account-help">
          Zur Bestätigung gib bitte die E-Mail des Accounts exakt ein: <strong>{confirmationPhrase}</strong>
        </p>

        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={confirmationPhrase}
          disabled={isLoading}
          className={`delete-account-input${phrase && !isValid ? ' input-invalid' : ''}`}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="modal-actions delete-account-actions">
          <button
            type="button"
            className="delete-account-cancel-button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="delete-account-confirm-button"
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
