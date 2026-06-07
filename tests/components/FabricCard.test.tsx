import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricCard from '@/components/FabricCard'

vi.mock('animal-island-ui', () => {
  const R = require('react') as typeof import('react')
  const Card = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    R.createElement('div', { ...props, ref }, (props as any).children),
  )
  Card.displayName = 'Card'
  return { Card, Button: () => null, Input: () => null, Typewriter: (p: any) => p.children, Cursor: (p: any) => p.children, Footer: () => null, Title: () => null, Icon: () => null, Divider: () => null, Modal: () => null, Loading: () => null, Select: () => null, ICON_LIST: [] }
})

const mockFabric = {
  id: 1,
  name: '碎花亚麻',
  type: '棉麻混纺',
  width: 145,
  unit: '米',
  price: 28,
  store: '晓港布料市场',
  purchase_date: '2026-05-15',
  photo_path: null,
  notes: null,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
}

describe('FabricCard', () => {
  it('should render fabric name', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText('碎花亚麻')).toBeInTheDocument()
  })

  it('should render type and status info', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText(/棉麻混纺/)).toBeInTheDocument()
    expect(screen.getByText('闲置中~')).toBeInTheDocument()
  })

  it('should render placeholder when no photo', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText('🧵')).toBeInTheDocument()
  })

  it('should link to detail page', () => {
    render(<FabricCard fabric={mockFabric} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/fabrics/1')
  })
})
