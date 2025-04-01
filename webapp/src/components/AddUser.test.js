import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // Importa MemoryRouter
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';

const mockAxios = new MockAdapter(axios);

describe('AddUser component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('should add user successfully', async () => {
    // Envuelve el componente en MemoryRouter
    render(
      <MemoryRouter>
        <AddUser />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Sign Up/i });

    // Mock de la solicitud axios.post para simular una respuesta exitosa
    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    // Simula la entrada del usuario
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Haz clic en el botón para agregar usuario
    fireEvent.click(addUserButton);

    // Espera a que el Snackbar se muestre
    await waitFor(() => {
      expect(screen.getByText(/User added successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle error when adding user', async () => {
    // Envuelve el componente en MemoryRouter
    render(
      <MemoryRouter>
        <AddUser />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Sign Up/i });

    // Mock de la solicitud axios.post para simular un error
    mockAxios.onPost('http://localhost:8000/adduser').reply(500, { error: 'Internal Server Error' });

    // Simula la entrada del usuario
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Haz clic en el botón para agregar usuario
    fireEvent.click(addUserButton);

    // Espera a que el Snackbar de error se muestre
    await waitFor(() => {
      expect(screen.getByText(/Error: Internal Server Error/i)).toBeInTheDocument();
    });
  });
});