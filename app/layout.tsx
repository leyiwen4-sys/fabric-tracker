import type { Metadata, Viewport } from 'next'
import 'animal-island-ui/style'
import './globals.css'
import ToastContainer from '@/components/Toast'
import { Cursor } from 'animal-island-ui'

export const metadata: Metadata = {
  title: '我的布料收藏',
  description: '记录和管理购买的布料',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Cursor>
          {children}
        </Cursor>
        <ToastContainer />
      </body>
    </html>
  )
}
