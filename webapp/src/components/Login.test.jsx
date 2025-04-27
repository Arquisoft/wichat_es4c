import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';

// MOCK COMPLETO de react-globe.gl
jest.mock('react-globe.gl', () => {
  return function MockGlobe() {
    return <div data-testid="mocked-globe">Mocked Globe</div>;
  };
});

// Mocks normales
jest.mock('axios');
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Login Component', () => {
  let mockOnLoginSuccess;

  beforeEach(() => {
    mockOnLoginSuccess = jest.fn();
    jest.spyOn(Storage.prototype, 'setItem'); // mock localStorage.setItem
    jest.clearAllMocks(); // Asegúrate de limpiar los mocks antes de cada test
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the login form and the back button', () => {
    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByTestId('mocked-globe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver atrás/i })).toBeInTheDocument(); // Verifica el botón "Volver atrás"
  });

  it('should handle successful login and display success message', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'test-token', createdAt: '2025-04-27T10:00:00.000Z', role: 'user' } });

    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
      expect(localStorage.setItem).toHaveBeenCalledWith('role', 'user');
      expect(mockedNavigate).toHaveBeenCalledWith('/startmenu');
      expect(screen.getByText(/your account was created on/i)).toBeInTheDocument(); // Verifica el mensaje de éxito
      expect(screen.getByRole('button', { name: /go to game/i })).toBeInTheDocument(); // Verifica el botón "Go to Game"
    });
  });

  it('should handle login error with string message', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: 'Invalid credentials' } });

    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      const errorSnackbar = screen.getByRole('alert');
      expect(errorSnackbar).toHaveTextContent(/invalid credentials/i);
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  it('should handle login error with array message', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: [{ msg: 'Username is required' }, { msg: 'Password is required' }] } });

    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      const errorSnackbar = screen.getByRole('alert');
      expect(errorSnackbar).toHaveTextContent(/username is required, password is required/i);
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  it('should handle login error with object message with error property', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Database connection error' } } });

    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      const errorSnackbar = screen.getByRole('alert');
      expect(errorSnackbar).toHaveTextContent(/database connection error/i);
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  it('should handle login error with object message with message property', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Authentication failed' } } });

    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      const errorSnackbar = screen.getByRole('alert');
      expect(errorSnackbar).toHaveTextContent(/authentication failed/i);
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  it('should navigate to home when back button is clicked', () => {
    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: /volver atrás/i }));
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });

  it('should handle window resize', () => {
    render(
      <Router>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </Router>
    );

    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;

    window.innerWidth = initialWidth + 100;
    window.innerHeight = initialHeight + 50;
    fireEvent(window, new Event('resize'));
  });
});
