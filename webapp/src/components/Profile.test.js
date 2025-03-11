import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Profile from './Profile';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

describe('Profile component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('should add a user and then fetch the profile', async () => {
    const testUser = {
      username: "testUser",
      password: "testPassword", // Se enviará en el POST
    };

    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };

    // Mock adding a user (POST request)
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200, { username: testUser.username });

    // Mock fetching the profile (GET request)
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    // Simular el POST para añadir el usuario
    await axios.post(`${apiEndpoint}/adduser`, testUser);

    // Renderizar Profile (simula que el usuario ya existe en la DB)
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Espera a que la API se haya llamado correctamente
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1); // Se llamó a /adduser
      expect(mockAxios.history.get.length).toBe(1);  // Se llamó a /profile/testUser
    });

    // Verifica que la información del perfil aparece en pantalla
    expect(screen.getByText(/testUser/i)).toBeInTheDocument();
    expect(screen.getByText(/Juegos Jugados/i)).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("120 seg")).toBeInTheDocument();
  });
});
