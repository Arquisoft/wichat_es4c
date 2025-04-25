import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser'; // Importa el componente a testear
import { BrowserRouter } from 'react-router-dom';

// --- MOCKS NECESARIOS ---

// Mock del globo 3D
jest.mock('react-globe.gl', () => {
  const MockGlobe = (props) => (
    <div data-testid="mock-globe" {...props}>
      Mocked Globe Component
    </div>
  );
  return MockGlobe;
});

// Mock del Typewriter
jest.mock('react-simple-typewriter', () => ({
  Typewriter: ({ words }) => <span>{words[0]}</span>,
}));

const mockAxios = new MockAdapter(axios);

// --- TESTS ---
describe('AddUser component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should add user successfully', async () => {
    renderWithRouter(<AddUser />);

    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Create Account/i });

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200);

    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword123' } });
    fireEvent.click(addUserButton);

    await waitFor(() => {
      expect(screen.getByText('User testUser created successfully!')).toBeInTheDocument();
    });
  });

  it('should handle error when adding user', async () => {
    renderWithRouter(<AddUser />);

    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Create Account/i });

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios
      .onPost(`${apiEndpoint}/adduser`)
      .reply(500, { error: 'Internal Server Error Test' });

    fireEvent.change(usernameInput, { target: { value: 'testUserError' } });
    fireEvent.change(passwordInput, { target: { value: 'testPasswordError123' } });
    fireEvent.click(addUserButton);

    await waitFor(() => {
      expect(screen.getByText(/Error: Internal Server Error Test/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for short inputs', async () => {
    renderWithRouter(<AddUser />);

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(usernameInput, { target: { value: 'us' } });
    fireEvent.change(passwordInput, { target: { value: 'pw' } });
    fireEvent.click(addUserButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Username must be at least 3 characters long/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Password must be at least 3 characters long/i)
      ).toBeInTheDocument();
    });

    expect(mockAxios.history.post.length).toBe(0);
  });
});
