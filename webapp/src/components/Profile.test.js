import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Profile from './Profile';

// Mock de axios
const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

// Mock del hook useNavigate
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Función utilitaria para renderizar el componente Profile dentro de un Router
const renderProfile = (initialRoute = '/profile', mockUsername) => {
  const initialEntries = [initialRoute];
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: jest.fn(() => ({ username: mockUsername })),
  }));
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/profile/:username?" element={<Profile />} />
        <Route path="/startmenu" element={<div>Start Menu</div>} />
        <Route path="/ranking" element={<div>Ranking Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Profile component', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockNavigate.mockReset();
    jest.clearAllMocks(); // Aseguramos que todos los mocks se limpien
  });

  it('should navigate to /startmenu if no username in params', async () => {
    await act(async () => {
      renderProfile('/profile');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/startmenu');
  });

  it('should fetch user profile and display data on success', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser', 'testUser');
    });

    await waitFor(() => expect(screen.getByText(/testUser/i)).toBeInTheDocument());
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("120 seg")).toBeInTheDocument();
  });

  it('should display error message and open snackbar on API error', async () => {
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500, { error: "API error" });

    await act(async () => {
      renderProfile('/profile/errorUser', 'errorUser');
    });

    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
    // Verifica que el Snackbar esté presente buscando contenido que incluya el error
    await waitFor(() => expect(screen.getByText(new RegExp('API error', 'i'))).toBeInTheDocument());
  });

  it('should navigate to /ranking when "Ver ranking" button is clicked', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser', 'testUser');
    });

    const viewRankingButton = await screen.findByTestId('view-ranking-button');
    fireEvent.click(viewRankingButton);
    expect(mockNavigate).toHaveBeenCalledWith('/ranking');
  });

  it('should ensure setLoading(false) is called after successful fetch', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser', 'testUser');
    });

    await waitFor(() => expect(screen.getByText(/testUser/i)).toBeInTheDocument());
  });

  it('should ensure setLoading(false) is called after API error', async () => {
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500, { error: "API error" });

    await act(async () => {
      renderProfile('/profile/errorUser', 'errorUser');
    });

    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
  });
});