import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricCard.module.css'

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
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{fabric.name}</div>
        <div className={styles.meta}>{meta}</div>
      </div>
    </Link>
  )
}
