import { createClient } from '@/lib/supabase/server'
import RevenueChart from '@/components/dashboard/RevenueChart'
import KpiCard from '@/components/dashboard/KpiCard'
import RecentOrders from '@/components/dashboard/RecentOrders'
import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Overview' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: ordersRaw },
    { data: productsRaw },
    { data: recentOrdersRaw },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total, created_at, status')
      .in('status', ['paid', 'shipped', 'delivered'])
      .order('created_at', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, stock, category')
      .eq('is_active', true)
      .order('stock', { ascending: true }),
    supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        profiles ( full_name ),
        order_items ( quantity, unit_price, products ( name ) )
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const orders = (ordersRaw ?? []) as any[]
  const products = (productsRaw ?? []) as any[]
  const recentOrders = (recentOrdersRaw ?? []) as any[]

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0)
  const orderCount = orders.length
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
  const lowStockProducts = products.filter((p: any) => p.stock < 10)

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const revenueByDay = new Map<string, number>()
  orders.forEach((order: any) => {
    const day = order.created_at.split('T')[0]
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + order.total)
  })

  const chartData = last30Days.map((date) => ({
    date,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: revenueByDay.get(date) ?? 0,
  }))

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>Last 30 days</p>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard label="Total revenue" value={`$${totalRevenue.toFixed(2)}`} sub={`${orderCount} orders`} />
        <KpiCard label="Avg order value" value={`$${avgOrderValue.toFixed(2)}`} sub="per order" />
        <KpiCard label="Products" value={String(products.length)} sub={`${lowStockProducts.length} low stock`} alert={lowStockProducts.length > 0} />
        <KpiCard label="Orders" value={String(orderCount)} sub="paid & fulfilled" />
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.cardTitle}>Revenue — last 30 days</h2>
        <RevenueChart data={chartData} />
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent orders</h2>
          <RecentOrders orders={recentOrders} />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Low stock</h2>
          {lowStockProducts.length === 0 ? (
            <p className={styles.empty}>All products well stocked.</p>
          ) : (
            <ul className={styles.stockList}>
              {lowStockProducts.map((p: any) => (
                <li key={p.id} className={styles.stockItem}>
                  <span className={styles.stockName}>{p.name}</span>
                  <span className={`${styles.stockCount} ${p.stock === 0 ? styles.stockOut : styles.stockLow}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
