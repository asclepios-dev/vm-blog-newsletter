'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

interface UserWithAvatar {
  id: string
  email: string
  firstName?: string
  avatar?: {
    url?: string
  } | string
}

export const NavbarAvatar: React.FC = () => {
  const { user } = useAuth<UserWithAvatar>()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user?.avatar) {
      if (typeof user.avatar === 'object' && user.avatar.url) {
        setAvatarUrl(user.avatar.url)
      } else if (typeof user.avatar === 'string') {
        // Fetch the media document if only ID is provided
        fetch(`/api/media/${user.avatar}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.url) {
              setAvatarUrl(data.url)
            }
          })
          .catch(console.error)
      }
    }
  }, [user])

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?'

  return (
    <div className="navbar-avatar">
      <style>{`
        .navbar-avatar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
        }
        .navbar-avatar__image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--theme-elevation-150);
        }
        .navbar-avatar__placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--theme-elevation-200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--theme-elevation-600);
        }
        .navbar-avatar__name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--theme-elevation-800);
        }
      `}</style>

      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="navbar-avatar__image" />
      ) : (
        <div className="navbar-avatar__placeholder">{initials}</div>
      )}
      {user?.firstName && <span className="navbar-avatar__name">{user.firstName}</span>}
    </div>
  )
}

export default NavbarAvatar
