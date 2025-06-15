import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '@/views/auth/SignUp';

const mockStore = configureStore([]);

describe('SignUp Component - Black Box', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      app: {
        authStatus: null,
        isAuthenticating: false
      }
    });
  });

  test(' User fills full name, email, and password correctly', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignUp history={{ push: jest.fn() }} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Jane Smith' }
    });
    fireEvent.change(screen.getByPlaceholderText('test@example.com'), {
      target: { value: 'jane@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Your Password'), {
      target: { value: 'Password1!' }
    });

    expect(screen.getByPlaceholderText('John Doe').value).toBe('Jane Smith');
  });

  test('Shows error for short name or weak password', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignUp history={{ push: jest.fn() }} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Al' }
    });
    fireEvent.change(screen.getByPlaceholderText('test@example.com'), {
      target: { value: 'invalidemail' }
    });
    fireEvent.change(screen.getByPlaceholderText('Your Password'), {
      target: { value: 'weakpass' }
    });

    fireEvent.click(screen.getByText(/Sign Up/i));

    expect(await screen.findByText(/Email is not valid/i)).toBeInTheDocument();
    expect(await screen.findByText(/Name should be at least 4 characters/i)).toBeInTheDocument();
  });
});
