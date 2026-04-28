'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import * as React from 'react'
import { JourneysActions, useJourneysStore } from '@/lib/journeys/store'
import { Modal, ModalPanel } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const NAV = [
  { href: '/trace', label: 'TRACE' },
  { href: '/collections', label: 'COLLECTIONS' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/studio', label: 'STUDIO' },
] as const

function CameraMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#111]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M8.5 7.5 9.6 5.8c.2-.3.5-.5.9-.5h3c.4 0 .7.2.9.5l1.1 1.7H18c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V9.5c0-1.1.9-2 2-2h2.5Z"
          stroke="white"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M12 17.2a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="white"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  )
}

function ExitMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--oj-line)] bg-[rgba(255,255,255,0.55)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 7H6.8c-.9 0-1.8.8-1.8 1.8v6.4c0 1 .9 1.8 1.8 1.8H10"
          stroke="#222"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M14 8.5 18.5 12 14 15.5"
          stroke="#222"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18.2 12H10.2" stroke="#222" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const isAdmin = useJourneysStore((s) => s.ui.isAdmin)
  const [authOpen, setAuthOpen] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--oj-line)] bg-[rgba(246,243,238,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10 py-6">
        <div className="flex items-center gap-4">
          <CameraMark />
          <div className="leading-none">
            <div className="text-[16px] font-medium tracking-[0.34em]">OUR JOURNEYS</div>
            <div className="mt-2 text-[10px] tracking-[0.42em] text-[var(--oj-muted)]">
              ARCHIVE OF LIGHT &amp; SALT
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <nav className="flex items-center gap-10 text-[12px] tracking-[0.32em] text-[var(--oj-muted)]">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'pb-1 transition-colors hover:text-[var(--oj-ink)]',
                    active && 'font-semibold text-[var(--oj-ink)]',
                  )}
                >
                  <span
                    className={cn(
                      'border-b border-transparent pb-1',
                      active && 'border-[var(--oj-khaki)]',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
          <button
            type="button"
            aria-label={isAdmin ? 'Sign out admin' : 'Admin sign in'}
            onClick={() => {
              if (isAdmin) {
                JourneysActions.setAdmin(false)
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('our-journeys:admin-pass')
                }
                return
              }
              setPassword('')
              setError('')
              setAuthOpen(true)
            }}
            className={cn('transition-opacity', isAdmin ? 'opacity-100' : 'opacity-85 hover:opacity-100')}
          >
            <ExitMark />
          </button>
        </div>
      </div>

      <Modal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false)
          setPassword('')
          setError('')
        }}
      >
        <ModalPanel className="max-w-[520px] border border-[var(--oj-line)] p-10">
          <div className="text-center text-[12px] tracking-[0.34em] text-[var(--oj-muted)]">
            ADMIN ACCESS
          </div>
          <div className="mt-2 text-center font-[var(--font-cormorant)] text-[22px] font-semibold tracking-[0.06em]">
            SIGN IN
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] tracking-[0.22em] text-[var(--oj-muted)]">PASSWORD</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const p = password.trim()
                  const ok = p === 'J54818'
                  if (!ok) {
                    setError('Invalid password')
                    return
                  }
                  JourneysActions.setAdmin(true)
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('our-journeys:admin-pass', p)
                  }
                  setAuthOpen(false)
                }
              }}
            />
            {error ? <div className="text-[12px] text-red-500/90">{error}</div> : null}
          </div>

          <div className="mt-10 flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setAuthOpen(false)
                setPassword('')
                setError('')
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const p = password.trim()
                const ok = p === 'J54818'
                if (!ok) {
                  setError('Invalid password')
                  return
                }
                JourneysActions.setAdmin(true)
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('our-journeys:admin-pass', p)
                }
                setAuthOpen(false)
              }}
            >
              ENTER
            </Button>
          </div>
        </ModalPanel>
      </Modal>
    </header>
  )
}
