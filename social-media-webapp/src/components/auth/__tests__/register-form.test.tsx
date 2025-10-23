import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { RegisterForm } from '../register-form'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the auth context
const mockSignUp = vi.fn()
const mockAuthContext = {
  user: null,
  userProfile: null,
  loading: false,
  signUp: mockSignUp,
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}

vi.mock('@/lib/contexts/auth-context', async () => ({
  ...await vi.importActual('@/lib/contexts/auth-context'),
  useAuth: () => mockAuthContext,
}))

const renderRegisterForm = () => {
  return render(
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  )
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    renderRegisterForm()
    
    expect(screen.getByText('Create account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation error for empty fields', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Display Name'), 'Test User')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid username', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Username'), 'ab') // Too short
    await user.type(screen.getByLabelText('Display Name'), 'Test User')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Username must be 3-20 characters and contain only letters, numbers, and underscores')).toBeInTheDocument()
    })
  })

  it('shows validation error for password mismatch', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Display Name'), 'Test User')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('calls signUp with correct data on valid form submission', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({})
    
    renderRegisterForm()
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Display Name'), 'Test User')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'testuser',
        'Test User'
      )
    })
  })

  it('displays error message when signUp fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Username is already taken'
    mockSignUp.mockResolvedValue({ error: errorMessage })
    
    renderRegisterForm()
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Username'), 'existinguser')
    await user.type(screen.getByLabelText('Display Name'), 'Test User')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('converts username to lowercase', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    const usernameInput = screen.getByLabelText('Username')
    await user.type(usernameInput, 'TestUser')
    
    expect(usernameInput).toHaveValue('testuser')
  })

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup()
    renderRegisterForm()
    
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const toggleButtons = screen.getAllByRole('button', { name: '' }) // Eye icon buttons
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // Toggle first password field
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Toggle second password field
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
  })
})