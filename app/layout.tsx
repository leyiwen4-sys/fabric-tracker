import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '我的布料收藏',
  description: '记录和管理购买的布料',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
