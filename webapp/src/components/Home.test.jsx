import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home'; // Asegúrate que la ruta sea correcta

// --- EL MOCK SIGUE SIENDO NECESARIO Y CORRECTO ---
jest.mock('react-globe.gl', () => {
  const MockGlobe = (props) => (
    <div data-testid="mock-globe" {...props}>
      Mocked Globe Component
    </div>
  );
  return MockGlobe;
});
// --- FIN DEL MOCK ---

describe('Home Component', () => {
  // Test para verificar el contenido renderizado
  test('renders the Home component with correct content', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // --- VERIFICACIONES CORREGIDAS ---
    // Verificar el título principal (h1)
    expect(screen.getByRole('heading', { name: /WICHAT/i, level: 1 })).toBeInTheDocument();

    // Verificar el subtítulo (h6)
    expect(screen.getByRole('heading', { name: /Test your geography knowledge!/i, level: 6 })).toBeInTheDocument();
    // Alternativa si prefieres buscar por texto directamente:
    // expect(screen.getByText(/Test your geography knowledge!/i)).toBeInTheDocument();

    // Verificar los botones/links (estos ya parecían correctos)
    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
    // También puedes usar data-testid si lo prefieres
    expect(screen.getByTestId('login-button')).toBeInTheDocument();


    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
    // --- FIN DE VERIFICACIONES CORREGIDAS ---

    // Verificar que nuestro mock del globo se renderizó
    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();
    expect(screen.getByText(/Mocked Globe Component/i)).toBeInTheDocument();
  });

  // Test para verificar estilos básicos
  test('applies correct styles to the Home component', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Verificar el estilo de fondo del contenedor principal
    const container = screen.getByTestId('home-container');
    // CORRECCIÓN: Usar el color de fondo real de tu Home.jsx
    expect(container).toHaveStyle('background: #000010');
    // Alternativa usando el valor rgb que mostró el error:
    // expect(container).toHaveStyle('background: rgb(0, 0, 16)');

    // Verificar el color del texto en el Paper (asegúrate que esta selección sea robusta)
    // El Paper es el contenedor de los títulos y botones
    // Podemos buscarlo por el texto que contiene y luego subir al contenedor Paper
    const paperElement = screen.getByText(/WICHAT/i).closest('.MuiPaper-root'); // Busca el ancestro con la clase MuiPaper-root
    expect(paperElement).toHaveStyle('color: white');
    // También podrías añadir un data-testid al Paper en Home.jsx para una selección más fiable:
    // En Home.jsx: <Paper data-testid="content-paper" ... >
    // En Home.test.js: expect(screen.getByTestId('content-paper')).toHaveStyle('color: white');


    // Verificar que el mock también está presente en este test
     expect(screen.getByTestId('mock-globe')).toBeInTheDocument();
  });
});