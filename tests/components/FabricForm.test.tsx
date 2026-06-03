import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricForm from '@/components/FabricForm'

// Mock next/navigation before importing the component
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('FabricForm', () => {
  it('should render all form fields', () => {
    render(<FabricForm />)
    expect(screen.getByPlaceholderText(/布料名称/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/棉.*麻.*丝/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('145')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/米.*码/)).toBeInTheDocument()
  })

  it('should show save button', () => {
    render(<FabricForm />)
    expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument()
  })
})
