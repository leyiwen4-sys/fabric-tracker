import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricCard.module.css'

const statusColors: Record<string, string> = {
  idle: '#27ae60',
  used: '#f39c12',
  empty: '#999999',
}

export default function FabricCard({ fabric }: { fabric: Fabric }) {
  const meta = [
    fabric.type,
    fabric.width ? `${fabric.width}cm` : null,
    fabric.price ? `¥${fabric.price}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/fabrics/${fabric.id}`} className={styles.card}>
      <div className={styles.photo}>
        {fabric.photo_path ? (
          <img src={fabric.photo_path} alt={fabric.name} />
        ) : (
          '🧵'
        )}
        <span
          className={styles.statusDot}
          style={{
            background: statusColors[fabric.status || 'idle'],
          }}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{fabric.name}</div>
        <div className={styles.meta}>{meta}</div>
      </div>
    </Link>
  )
}
