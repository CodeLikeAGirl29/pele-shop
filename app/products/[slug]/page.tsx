import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/store/Nav'
import AddToCartButton from '@/components/store/AddToCartButton'
import type { Metadata } from 'next'
import type { Product } from '@/types/database'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .single()
  const product = data as Pick<Product, 'name' | 'description'> | null
  if (!product) return { title: 'Product not found' }
  return { title: product.name, description: product.description ?? undefined }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  const product = data as Product | null
  if (!product) notFound()

  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', color: 'var(--ink-3)' }
      : product.stock < 10
      ? { label: `Only ${product.stock} left`, color: 'var(--warning)' }
      : { label: 'In stock', color: 'var(--success)' }

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Shop</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/?category=${product.category}`}>{product.category}</Link>
          <span aria-hidden="true"> / </span>
          <span>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.imageCol}>
            <div className={styles.imageWrap}>
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className={styles.image}
                  priority
                />
              ) : (
                <div className={styles.imagePlaceholder} />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbs}>
                {product.images.map((src: string, i: number) => (
                  <div key={i} className={styles.thumb}>
                    <Image src={src} alt={`${product.name} view ${i + 1}`} fill sizes="80px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoCol}>
            <p className={styles.category}>{product.category}</p>
            <h1 className={styles.name}>{product.name}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
              <span className={styles.stock} style={{ color: stockStatus.color }}>
                {stockStatus.label}
              </span>
            </div>
            <p className={styles.description}>{product.description}</p>
            <div className={styles.divider} />
            <AddToCartButton product={product} />
            <div className={styles.divider} />
            <div className={styles.trust}>
              <div className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Free shipping on orders over $75
              </div>
              <div className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                30-day returns
              </div>
              <div className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Maker-verified quality
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
