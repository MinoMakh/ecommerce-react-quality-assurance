import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import SignIn from '@/views/auth/SignIn';

const mockStore = configureStore([]);

describe('SignIn Component - Black Box', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      app: {
        authStatus: null,
        isAuthenticating: false
      }
    });
  });

  test('✅ Successful email and password input', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignIn history={{ push: jest.fn() }} />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText('test@example.com');
    const passwordInput = screen.getByPlaceholderText('Your Password');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    expect(emailInput.value).toBe('user@example.com');
    expect(passwordInput.value).toBe('Password123!');
  });

  test('❌ Shows error messages for empty inputs on submit', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignIn history={{ push: jest.fn() }} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(await screen.findByText('Password is required.')).toBeInTheDocument();
  });
});
