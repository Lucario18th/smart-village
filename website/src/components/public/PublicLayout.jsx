import React from 'react'

export default function PublicLayout({ children }) {
  return (
    <div className="public-page">
      <main className="public-main public-main--full">{children}</main>
    </div>
  )
}
