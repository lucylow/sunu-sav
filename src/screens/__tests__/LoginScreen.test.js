import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

// Mock the store
jest.mock('../src/store/useStore', () => ({
  useStore: () => ({
    setUser: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Tontine Bitcoin')).toBeTruthy();
  });

  it('shows phone input field', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('77 123 45 67')).toBeTruthy();
  });

  it('shows continue button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('continue')).toBeTruthy();
  });
});
