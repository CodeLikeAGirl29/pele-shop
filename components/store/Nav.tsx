'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useCartUI } from '@/store/cartUI'
import styles from './Nav.module.css'

export default function Nav() {
  const totalItems = useCartStore((state) => state.totalItems())
  const { open } = useCartUI()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.wordmark}>
        pelé<span className={styles.dot}>.</span>
      </Link>

      <ul className={styles.links}>
        <li><Link href="/">Shop</Link></li>
        <li><Link href="/collections">Collections</Link></li>
        <li><Link href="/about">About</Link></li>
      </ul>

      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>

        {/* Now calls open() from cartUI store */}
        <button className={styles.cartBtn} onClick={open} aria-label="Open cart">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Cart
          {mounted && totalItems > 0 && (
            <span className={styles.count}>{totalItems}</span>
          )}
        </button>
      </div>
    </nav>
  )
}
