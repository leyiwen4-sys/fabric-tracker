import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import { Card } from 'animal-island-ui'
import styles from './FabricCard.module.css'

const statusLabels: Record<string, string> = {
  idle: '闲置中~',
  used: '用掉一点啦~',
  empty: '已经用完啦！',
}

const statusColors: Record<string, string> = {
  idle: '#27ae60',
  used: '#f39c12',
  empty: '#999999',
}

export default function FabricCard({ fabric }: { fabric: Fabric }) {
  return (
    <Link href={`/fabrics/${fabric.id}`} className={styles.link}>
      <Card className={styles.card}>
        <div className={styles.photo}>
          {fabric.photo_path ? (
            <img src={fabric.photo_path} alt={fabric.name} />
          ) : (
            '🧵'
          )}
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{fabric.name}</div>
          <div className={styles.meta}>
            <span>{fabric.type || '-'}</span>
            <span
              className={styles.statusBadge}
              style={{ background: statusColors[fabric.status || 'idle'] }}
            >
              {statusLabels[fabric.status || 'idle']}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
