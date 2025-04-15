import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom'; // Necesario para useNavigate
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from './Login'; // Importa el componente Login

// --- INICIO DEL MOCK ---
// Mockeamos 'react-globe.gl' porque Login también lo renderiza.
jest.mock('react-globe.gl', () => {
  const MockGlobe = (props) => (
    <div data-testid="mock-globe" {...props}>
      Mocked Globe Component
    </div>
  );
  return MockGlobe;
});
// --- FIN DEL MOCK ---

// Mock de useNavigate para evitar errores y opcionalmente verificar navegación
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // usa las implementaciones reales para todo lo demás
  useNavigate: () => mockedNavigate, // reemplaza useNavigate con nuestro mock
}));


const mockAxios = new MockAdapter(axios);

describe('Login component', () => {
  let mockOnLoginSuccess; // Declara la función mock para onLoginSuccess

  beforeEach(() => {
    mockAxios.reset();
    mockedNavigate.mockClear(); // Limpia el mock de navigate antes de cada test
    mockOnLoginSuccess = jest.fn(); // Crea una nueva función mock antes de cada test
  });

  // Helper para renderizar con Router y props necesarias
  const renderLoginComponent = () => {
     render(
      <BrowserRouter>
        {/* Pasamos la función mock como prop */}
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </BrowserRouter>
    );
  }

  it('should log in successfully and call onLoginSuccess', async () => {
    renderLoginComponent(); // Renderiza usando el helper

    // Verifica que el mock del globo se renderiza
    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();

    // CORRECCIÓN: Usar getByPlaceholderText porque los InputField usan placeholder, no label
    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    // El botón tiene data-testid="submit-button" y texto "Login"
    const loginButton = screen.getByRole('button', { name: /Login/i });
    // Alternativa: const loginButton = screen.getByTestId('submit-button');

    // Mockea la respuesta exitosa de la API /login
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const fakeCreationDate = '2025-04-15T19:25:00Z'; // Fecha coherente con el test
    mockAxios.onPost(`${apiEndpoint}/login`).reply(200, { createdAt: fakeCreationDate });

    // Simula la entrada del usuario
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Simula el clic en el botón
    fireEvent.click(loginButton);

    // Espera a que aparezca el mensaje de éxito post-login
    // El formato de fecha depende de toLocaleDateString, puede variar. Usemos una expresión regular flexible.
    await waitFor(() => {
        // Verifica que se muestra parte del mensaje de cuenta creada
        expect(screen.getByText(/Your account was created on/i)).toBeInTheDocument();
        // Verifica que la función onLoginSuccess fue llamada
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
        // Verifica que se intentó navegar a /startmenu
        expect(mockedNavigate).toHaveBeenCalledWith('/startmenu');
    });

     // Verifica que el snackbar de éxito (que dice "Login successful") se muestra brevemente
     // Esto es más difícil de capturar si desaparece rápido, pero podemos intentarlo:
     // expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
     // O esperar que aparezca y desaparezca si fuera necesario

  });

  it('should handle error when logging in', async () => {
    renderLoginComponent(); // Renderiza usando el helper

    // Verifica que el mock del globo se renderiza
    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();

    // CORRECCIÓN: Usar getByPlaceholderText
    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    // Mockea la respuesta de error de la API /login
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    mockAxios.onPost(`${apiEndpoint}/login`).reply(401, 'Invalid credentials test'); // Mensaje de error como string

    // Simula la entrada del usuario
    fireEvent.change(usernameInput, { target: { value: 'wrongUser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });

    // Simula el clic en el botón
    fireEvent.click(loginButton);

    // Espera a que aparezca el mensaje de error en el Snackbar
    // El mensaje viene de `Error: ${error}` en Login.jsx
    await waitFor(() => {
      expect(screen.getByText(/Error: Invalid credentials test/i)).toBeInTheDocument();
    });

    // Verifica que la función onLoginSuccess NO fue llamada
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    // Verifica que NO se intentó navegar
    expect(mockedNavigate).not.toHaveBeenCalled();
    // Verifica que el mensaje de éxito NO se muestra
    expect(screen.queryByText(/Your account was created on/i)).toBeNull();
  });
});