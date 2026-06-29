// app/layout.tsx

import type { Metadata } from 'next'
import CartDrawer from '@/components/store/CartDrawer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s — pelé.',
    default: 'pelé. — Objects made to last a lifetime',
  },
  description:
    'Thoughtfully sourced home goods. Each piece chosen for craftsmanship, not trends.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/*
          CartDrawer lives here in the root layout so it's
          available on every page — storefront, product detail,
          about page. It manages its own open/close state via
          the useCartUI Zustand store.
        */}
        <CartDrawer />
      </body>
    </html>
  )
}
