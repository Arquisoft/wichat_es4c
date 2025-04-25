import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPanel from './AdminPanel'; // Ajusta la ruta según tu estructura

// --- Mocking global fetch y localStorage ---

// Guardamos las implementaciones originales para restaurarlas después
const originalFetch = global.fetch;
const originalLocalStorage = global.localStorage;

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeAll(() => {
  // Reemplazamos localStorage global con nuestro mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  // Ponemos un token de prueba en nuestro localStorage mockeado
  window.localStorage.setItem('token', 'test-token');
});

beforeEach(() => {
  // Reseteamos el mock de fetch antes de cada test
  global.fetch = jest.fn();
});

afterEach(() => {
  // Limpiamos todos los mocks después de cada test
  jest.clearAllMocks();
});

afterAll(() => {
  // Restauramos las implementaciones originales
  global.fetch = originalFetch;
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
  });
});

// --- Datos de prueba ---
const mockUsers = [
  { _id: '1', username: 'adminUser', role: 'admin' },
  { _id: '2', username: 'testUser1', role: 'user' },
  { _id: '3', username: 'testUser2', role: 'user' },
  { _id: '4', username: 'testUser3', role: 'user' },
  { _id: '5', username: 'testUser4', role: 'user' },
  { _id: '6', username: 'testUser5', role: 'user' }, // Para probar paginación
  { _id: '7', username: 'testUser6', role: 'user' }, // Para probar paginación
];

// --- Tests ---

describe('AdminPanel Component', () => {
  // Test 1: Renderizado inicial y estado de carga
  test('renders loading state initially and fetches users', async () => {
    // Mock para la llamada inicial de fetchUsers
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers.slice(0, 5), // Devolver solo los primeros 5 para la página 1 inicialmente
    });

    render(<AdminPanel />);

    // Verifica que el título y el subtítulo están presentes
    expect(screen.getByText(/Panel de Administración/i)).toBeInTheDocument();
    expect(screen.getByText(/Aquí puedes gestionar los usuarios/i)).toBeInTheDocument();

    // Verifica que el indicador de carga se muestra inicialmente
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Espera a que el indicador de carga desaparezca (lo que significa que fetchUsers se completó)
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verifica que la función fetch fue llamada una vez para obtener usuarios
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/adminPanel'), // Verifica parte de la URL
      {
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );
  });

  // Test 2: Muestra los usuarios después de la carga
  test('displays users in the table after loading', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers, // Devuelve todos los usuarios ahora
    });

    render(<AdminPanel />);

    // Espera a que los datos se carguen y se muestren
    // Busca por el nombre de un usuario esperado en la primera página
    await waitFor(() => {
        expect(screen.getByText('testUser1')).toBeInTheDocument();
    });

    // Verifica que los encabezados de la tabla están presentes
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Rol')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Verifica que los usuarios de la primera página se muestran
    expect(screen.getByText('adminUser')).toBeInTheDocument();
    expect(screen.getByText('testUser1')).toBeInTheDocument();
    expect(screen.getByText('testUser4')).toBeInTheDocument(); // El último de la primera página

    // Verifica que un usuario de la segunda página NO se muestra inicialmente
    expect(screen.queryByText('testUser5')).not.toBeInTheDocument();
  });

  // Test 3: No muestra el botón de eliminar para usuarios admin
  test('does not show delete button for admin users', async () => {
     global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    render(<AdminPanel />);

    await waitFor(() => {
        expect(screen.getByText('adminUser')).toBeInTheDocument();
    });

    // Encuentra la fila del admin
    const adminRow = screen.getByText('adminUser').closest('tr');
    // Dentro de esa fila, busca un botón que contenga el texto "Eliminar"
    // `queryBy` devuelve null si no lo encuentra, lo cual es lo que esperamos
    expect(within(adminRow).queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();

    // Encuentra la fila de un usuario normal
    const userRow = screen.getByText('testUser1').closest('tr');
     // Dentro de esa fila, busca el botón "Eliminar"
    // `getBy` lanza error si no lo encuentra.
    expect(within(userRow).getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  // Test 4: Permite eliminar un usuario no admin (éxito)
  test('allows deleting a non-admin user successfully', async () => {
    // Mock inicial para cargar usuarios
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    // Mock para la llamada DELETE (éxito)
    global.fetch.mockResolvedValueOnce({
        ok: true, // Simula una respuesta exitosa del servidor
    });

    render(<AdminPanel />);

    // Espera a que los usuarios se carguen
    await waitFor(() => {
      expect(screen.getByText('testUser1')).toBeInTheDocument();
    });

    // Encuentra la fila del usuario a eliminar
    const userToDeleteRow = screen.getByText('testUser1').closest('tr');
    const deleteButton = within(userToDeleteRow).getByRole('button', { name: /eliminar/i });

    // Haz clic en el botón de eliminar
    fireEvent.click(deleteButton);

    // Verifica que fetch fue llamado para la eliminación
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/adminPanel/deleteUser/testUser1'), // URL correcta
      expect.objectContaining({ // Verifica método y headers
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer test-token',
          },
      })
    );


    // Verifica que otros usuarios aún están presentes
    expect(screen.getByText('adminUser')).toBeInTheDocument();
    expect(screen.getByText('testUser2')).toBeInTheDocument();
  });

    // Test 5: Maneja el fallo al eliminar un usuario
  test('handles error when deleting a user fails', async () => {
    // Mock consola para evitar que ensucie la salida del test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock inicial para cargar usuarios
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    // Mock para la llamada DELETE (fallo)
    global.fetch.mockResolvedValueOnce({
        ok: false, // Simula un error del servidor
        status: 500,
    });

    render(<AdminPanel />);

    // Espera a que los usuarios se carguen
    await waitFor(() => {
      expect(screen.getByText('testUser1')).toBeInTheDocument();
    });

    // Encuentra y haz clic en el botón de eliminar
    const userToDeleteRow = screen.getByText('testUser1').closest('tr');
    const deleteButton = within(userToDeleteRow).getByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButton);

    // Espera a que la llamada fetch de DELETE se complete
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

     // Verifica que el usuario NO fue eliminado de la UI
    expect(screen.getByText('testUser1')).toBeInTheDocument();

    // Restaura el mock de console.error
    consoleErrorSpy.mockRestore();
  });


  // Test 6: Funcionalidad de Paginación
  test('pagination works correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers, // Devuelve la lista completa
    });

    render(<AdminPanel />);

    // Espera a que la primera página cargue
    await waitFor(() => {
      expect(screen.getByText('testUser1')).toBeInTheDocument(); // Usuario de la página 1
    });

    // Verifica usuarios de la página 1 y ausencia de los de la página 2
    expect(screen.getByText('testUser4')).toBeInTheDocument();
    expect(screen.queryByText('testUser5')).not.toBeInTheDocument();
    expect(screen.queryByText('testUser6')).not.toBeInTheDocument();

    const pageTwoButton = screen.getByRole('button', { name: /go to page 2/i }); 
    expect(pageTwoButton).toBeInTheDocument();

    // Haz clic para ir a la página 2
    fireEvent.click(pageTwoButton);

    // Espera a que el contenido de la tabla se actualice (aparezca un usuario de la pag 2)
    await waitFor(() => {
       expect(screen.getByText('testUser5')).toBeInTheDocument();
    });

    // Verifica que los usuarios de la página 2 ahora son visibles
    expect(screen.getByText('testUser6')).toBeInTheDocument();

    // Verifica que los usuarios de la página 1 ya NO son visibles
    expect(screen.queryByText('testUser1')).not.toBeInTheDocument();
    expect(screen.queryByText('testUser4')).not.toBeInTheDocument();

    // Verifica que el botón de la página 2 está marcado como actual ('aria-current' o clase 'Mui-selected')
     expect(pageTwoButton).toHaveAttribute('aria-current', 'true');


    // Vuelve a la página 1
    const pageOneButton = screen.getByRole('button', { name: /go to page 1/i });
    fireEvent.click(pageOneButton);

     // Espera a que el contenido de la tabla se actualice (aparezca un usuario de la pag 1)
    await waitFor(() => {
       expect(screen.getByText('testUser1')).toBeInTheDocument();
    });
    expect(screen.queryByText('testUser5')).not.toBeInTheDocument(); // Usuario pag 2 desaparece


  });

   

});

// Helper para buscar dentro de un elemento específico (como una fila de tabla)
import { within } from '@testing-library/react';