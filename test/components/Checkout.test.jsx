import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShippingDetails from '../../src/views/checkout/step2/index';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import * as reactRedux from 'react-redux';


const mockStore = configureStore([]);
const subtotal = 100;

const renderWithProviders = (ui, { store }) =>
  render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );

const fillCommonFields = () => {
  fireEvent.change(screen.getByPlaceholderText(/email address/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByPlaceholderText(/shipping address/i), {
    target: { value: '123 Main St' }
  });

};

describe('ShippingDetails Form', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        id: 'test-user-id',
        role: 'USER'
      },
      checkout: {
        shipping: {
          fullname: '',
          email: '',
          address: '',
          mobile: {},
          isInternational: false,
          isDone: false
        },
        payment: {
          name: '',
          cardnumber: '',
          expiry: '',
          ccv: ''
        }
      },
      profile: {},
      basket: [
        { id: 1, name: 'Test Product', price: 50 },
        { id: 2, name: 'Another Product', price: 100 }
      ]
    });
  });


  test('✅ Valid checkout credentials', async () => {
    const dispatchMock = vi.fn();
    vi.spyOn(reactRedux, 'useDispatch').mockReturnValue(dispatchMock);


    renderWithProviders(<ShippingDetails profile={{}} shipping={{}} subtotal={subtotal} />, { store });

    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fillCommonFields();

    fireEvent.click(screen.getByText(/next step/i));

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({
        type: 'SET_CHECKOUT_SHIPPING_DETAILS'
      }));
    });
  });


  test('❌ Missing full name shows error', async () => {
    renderWithProviders(<ShippingDetails profile={{}} shipping={{}} subtotal={subtotal} />, { store });

    fillCommonFields();

    fireEvent.click(screen.getByText(/next step/i));

    expect(await screen.findByText(/Full name is required./i)).toBeInTheDocument();
  });

  test('❌ Invalid email format shows error', async () => {
    renderWithProviders(<ShippingDetails profile={{}} shipping={{}} subtotal={subtotal} />, { store });

    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'Jane Smith' }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.blur(screen.getByPlaceholderText(/email address/i));
    fireEvent.change(screen.getByPlaceholderText(/shipping address/i), {
      target: { value: '456 Street' }
    });

    fireEvent.click(screen.getByText(/next step/i));

    expect(await screen.findByText((content) =>
      content.includes('Email is not valid.'))).toBeInTheDocument();

  });

  test('❌ Digits in full name show error (custom logic required)', async () => {
    renderWithProviders(<ShippingDetails profile={{}} shipping={{}} subtotal={subtotal} />, { store });

    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'John123' }
    });
    fillCommonFields();

    fireEvent.click(screen.getByText(/next step/i));

    // This will not trigger error unless you add custom Yup regex
    // Add `.matches(/^[a-zA-Z\s]+$/, "Full name must not contain digits.")` to validation
    expect(await screen.findByText(/Full name must not contain digits./i)).toBeInTheDocument();
  });
});
