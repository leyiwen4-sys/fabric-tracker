import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricForm from '@/components/FabricForm'

// Mock animal-island-ui
vi.mock('animal-island-ui', () => {
  const R = require('react') as typeof import('react')

  const Button = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    R.createElement('button', { ...props, ref }, (props as any).children),
  )
  Button.displayName = 'Button'

  const Input = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    R.createElement('input', { ...props, ref }),
  )
  Input.displayName = 'Input'

  const Card = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    R.createElement('div', { ...props, ref }, (props as any).children),
  )
  Card.displayName = 'Card'

  const Title = (props: Record<string, unknown>) =>
    R.createElement('div', {}, (props as any).children)

  const Modal = (props: Record<string, unknown>) => {
    const p = props as any
    return p.open ? R.createElement('div', {}, p.children, p.footer) : null
  }

  const Loading = () => null

  const Select = (props: Record<string, unknown>) =>
    R.createElement('select', props, (props as any).options?.map((o: any) =>
      R.createElement('option', { key: o.key, value: o.key }, o.label),
    ))

  return { Button, Input, Card, Title, Modal, Loading, Select, Typewriter: (p: any) => p.children, Cursor: (p: any) => p.children, Footer: () => null, Icon: () => null, Divider: () => null, ICON_LIST: [] }
})

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
