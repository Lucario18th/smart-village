import React from 'react'

const DEFAULT_LINKS = {
  support: {
    label: 'Support',
    href: import.meta.env?.VITE_SUPPORT_URL || '#',
  },
  docs: {
    label: 'Dokumentation',
    href: import.meta.env?.VITE_DOCS_URL || '/doku-Neu/README.md',
  },
  github: {
    label: 'GitHub',
    href: import.meta.env?.VITE_GITHUB_URL || '#',
  },
  linkedin: {
    label: 'LinkedIn',
    href: import.meta.env?.VITE_SOCIAL_LINKEDIN_URL || '#',
  },
  instagram: {
    label: 'Instagram',
    href: import.meta.env?.VITE_SOCIAL_INSTAGRAM_URL || '#',
  },
  email: {
    label: 'E-Mail',
    href: import.meta.env?.VITE_SUPPORT_EMAIL ? `mailto:${import.meta.env.VITE_SUPPORT_EMAIL}` : '#',
  },
}

function FooterLink({ href, label }) {
  const isPlaceholder = !href || href === '#'

  if (isPlaceholder) {
    return (
      <span className="site-meta-link site-meta-link--pending" title="Link wird spaeter hinterlegt">
        {label} (bald)
      </span>
    )
  }

  const isExternal = /^https?:\/\//i.test(href)
  return (
    <a
      className="site-meta-link"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      {label}
    </a>
  )
}

export default function SiteMetaFooter({ audience = 'user' }) {
  return (
    <footer className="site-meta-footer" aria-label="Support und Projektlinks">
      <p className="site-meta-title">
        Smart Village {audience === 'admin' ? 'Admin' : 'User'}
      </p>
      <div className="site-meta-links">
        <FooterLink {...DEFAULT_LINKS.support} />
        <FooterLink {...DEFAULT_LINKS.docs} />
        <FooterLink {...DEFAULT_LINKS.github} />
        <FooterLink {...DEFAULT_LINKS.linkedin} />
        <FooterLink {...DEFAULT_LINKS.instagram} />
        <FooterLink {...DEFAULT_LINKS.email} />
      </div>
    </footer>
  )
}
