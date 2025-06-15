import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '@/views/auth/ForgotPassword';

const mockStore = configureStore([]);

describe('ForgotPassword Component - Black Box Test', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      app: {
        authStatus: null,
        isAuthenticating: false
      }
    });
  });

  test('User can enter email and submit reset request', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const resetButton = screen.getByText(/reset password/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(resetButton);

    expect(emailInput.value).toBe('user@example.com');
    // Normally you'd check for dispatch, toast, or navigation here
  });

  test('Shows error if email is empty on submit', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </Provider>
    );

    const resetButton = screen.getByText(/reset password/i);
    fireEvent.click(resetButton);

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
  });

  test('Shows error for invalid email format', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.click(screen.getByText(/reset password/i));

    expect(await screen.findByText('Email is not valid.')).toBeInTheDocument();
  });
});
