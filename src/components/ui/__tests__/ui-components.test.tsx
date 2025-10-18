/**
 * Tests para componentes UI básicos
 * Sistema de Gestión de Eventos V3
 */

import React from 'react'
import { render, screen, fireEvent } from '../../../lib/test-utils'
import { Button } from '../button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card'
import { Input } from '../input'
import { Label } from '../label'

describe('UI Components', () => {
  describe('Button', () => {
    it('should render with correct text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should handle click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should apply variant classes correctly', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply size classes correctly', () => {
      render(<Button size="sm">Small Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      expect(screen.getByRole('link')).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    it('should render card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('should apply correct CSS classes', () => {
      render(
        <Card data-testid="card">
          <CardContent>Content</CardContent>
        </Card>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
    })
  })

  describe('Input', () => {
    it('should render input with correct attributes', () => {
      render(
        <Input
          type="email"
          placeholder="Enter email"
          value="test@example.com"
          readOnly
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveAttribute('placeholder', 'Enter email')
      expect(input).toHaveValue('test@example.com')
    })

    it('should handle change events', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new value' } })

      expect(handleChange).toHaveBeenCalled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should accept custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Label', () => {
    it('should render with correct text', () => {
      render(<Label>Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should associate with input via htmlFor', () => {
      render(
        <div>
          <Label htmlFor="test-input">Email</Label>
          <Input id="test-input" type="email" />
        </div>
      )

      const label = screen.getByText('Email')
      const input = screen.getByRole('textbox')

      expect(label).toHaveAttribute('for', 'test-input')
      expect(input).toHaveAttribute('id', 'test-input')
    })

    it('should apply custom className', () => {
      render(<Label className="custom-label" data-testid="label">Test</Label>)
      const label = screen.getByTestId('label')
      expect(label).toHaveClass('custom-label')
    })
  })

  describe('Form Integration', () => {
    it('should work together in a form', () => {
      const handleSubmit = jest.fn()
      
      render(
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Login Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Login</Button>
            </CardFooter>
          </Card>
        </form>
      )

      expect(screen.getByText('Login Form')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })
  })
})