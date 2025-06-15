import * as Yup from 'yup';

// Sign In Schema
const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email is not valid.')
    .required('Email is required.'),
  password: Yup.string()
    .required('Password is required.')
});

// Sign Up Schema
const SignUpSchema = Yup.object().shape({
  fullname: Yup.string()
    .required('Full name is required.')
    .min(4, 'Name should be at least 4 characters.'),
  email: Yup.string()
    .email('Email is not valid.')
    .required('Email is required.'),
  password: Yup.string()
    .required('Password is required.')
    .min(8, 'Password length should be at least 8 characters.')
    .matches(/[A-Z\W]/g, 'Password should contain at least 1 uppercase letter.')
});

// White Box Unit Tests
describe('✅ White Box Validation Tests', () => {
  test('Valid Sign In schema', async () => {
    await expect(
      SignInSchema.validate({
        email: 'user@example.com',
        password: 'MyPass123!'
      })
    ).resolves.toBeTruthy();
  });

  test('Invalid Sign In schema (missing password)', async () => {
    await expect(
      SignInSchema.validate({
        email: 'user@example.com',
        password: ''
      }, { abortEarly: false })
    ).rejects.toThrow('Password is required.');
  });

  test('Valid Sign Up schema', async () => {
    await expect(
      SignUpSchema.validate({
        fullname: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Secure123!'
      })
    ).resolves.toBeTruthy();
  });

  test('Invalid Sign Up schema (short name, weak password)', async () => {
    try {
      await SignUpSchema.validate({
        fullname: 'Jo',
        email: 'jane@example.com',
        password: 'password'
      }, { abortEarly: false });
    } catch (err) {
      // Check multiple validation errors
      expect(err.errors).toContain('Name should be at least 4 characters.');
      expect(err.errors).toContain('Password should contain at least 1 uppercase letter.');
    }
  });
});
