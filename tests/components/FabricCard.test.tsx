import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricCard from '@/components/FabricCard'

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

  it('should render type, width and price info', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText(/棉麻混纺/)).toBeInTheDocument()
    expect(screen.getByText(/145cm/)).toBeInTheDocument()
    expect(screen.getByText(/¥28/)).toBeInTheDocument()
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
