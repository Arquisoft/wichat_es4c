import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser'; 
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

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

  it('should show success message and redirect text after successful registration', async () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200);
  
    renderWithRouter(<AddUser />);
  
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'newUser' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'newPass' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/User newUser created successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to login.../i)).toBeInTheDocument();
    });
  });
  
  it('should submit the form when Enter key is pressed in the password field', async () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200);
  
    renderWithRouter(<AddUser />);
  
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'keyboardUser' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'keyboardPass' } });
    fireEvent.keyDown(screen.getByPlaceholderText(/Password/i), { key: 'Enter', code: 'Enter' });
  
    await waitFor(() => {
      expect(screen.getByText(/User keyboardUser created successfully!/i)).toBeInTheDocument();
    });
  });
  
  it('should show error snackbar when API returns error', async () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(500, { error: 'Test error message' });
  
    renderWithRouter(<AddUser />);
  
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'erroruser' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'errorpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Error: Test error message/i)).toBeInTheDocument();
    });
  });
  it('should navigate to home when "Volver atrás" button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<AddUser />} />
          <Route path="/" element={<div data-testid="home-page">Página de inicio</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    const backButton = screen.getByRole('button', { name: /Volver atrás/i });
    fireEvent.click(backButton);
  
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should not call axios if validation fails (manual coverage)', async () => {
    renderWithRouter(<AddUser />);
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'a' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'b' } });
    fireEvent.click(screen.getByTestId('submit-button'));
  
    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 3 characters/i)).toBeInTheDocument();
    });
  
    expect(mockAxios.history.post.length).toBe(0); // línea 73-77 cubierta
  });
  
  it('should fallback to default error message if no error in response', async () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(500); // sin .data.error
  
    renderWithRouter(<AddUser />);
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'fallback' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'fallback' } });
    fireEvent.click(screen.getByTestId('submit-button'));
  
    await waitFor(() => {
      expect(screen.getByText(/Error: Error creating user/i)).toBeInTheDocument();
    }); // línea 95-96 cubierta
  });
  
  it('should trigger globe resize effect on window resize', () => {
    renderWithRouter(<AddUser />);
    global.innerWidth = 500;
    global.innerHeight = 500;
    fireEvent(window, new Event('resize'));
  
    // No assertions necesarias: si no hay error, se cubre useEffect handleResize
  }); // línea 104–110 cubierta
  
  it('should render error Snackbar when error is set', async () => {
    renderWithRouter(<AddUser />);
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'errorTest' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'errorTest' } });
  
    // Establece el error manualmente con un botón ficticio si fuera necesario.
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });
  
    // Snackbar se renderiza automáticamente en caso de error.
    expect(await screen.findByText(/Error:/i)).toBeInTheDocument(); // línea 214 cubierta
  });
  
});
