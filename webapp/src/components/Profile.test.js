import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    const testUser = { username: "testUser" };

    const profileData = {
      username: testUser.username,
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };

    // Simula la respuesta de la API para añadir un usuario
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200, { username: testUser.username });

    // Simula la respuesta de la API para obtener el perfil
    mockAxios.onGet(`${apiEndpoint}/profile/${testUser.username}`).reply(200, profileData);


    await axios.post(`${apiEndpoint}/adduser`, { username: testUser.username });


    render(
      <MemoryRouter initialEntries={[`/profile/${testUser.username}`]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );


    await waitFor(() => expect(mockAxios.history.get.length).toBe(1));


    await waitFor(() => {
      expect(screen.getByText(/testUser/i)).toBeInTheDocument();
      expect(screen.getByText(/Juegos Jugados/i)).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("120 seg")).toBeInTheDocument();
    });
  });
});
