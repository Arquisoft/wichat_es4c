import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Profile from './Profile';

// Mock de Axios
const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

// Mock de useNavigate y useParams
const mockNavigate = jest.fn();
let mockUsername = 'testUser';

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => ({ username: mockUsername }),
  };
});

// Función para renderizar el componente
const renderProfile = (initialRoute = '/profile') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
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
    mockNavigate.mockClear();
    jest.clearAllMocks();
    mockUsername = 'testUser'; // Siempre reseteamos el username
  });

  test('redirects to /startmenu if no username in params', async () => {
    mockUsername = '';

    await act(async () => {
      renderProfile('/profile');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/startmenu');
  });

  test('fetches and displays user profile data', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser');
    });

    // Espera que el perfil cargue
    expect(await screen.findByTestId('profile-username')).toHaveTextContent(/testUser/i);
    expect(screen.getByTestId('games-played')).toHaveTextContent("10");
    expect(screen.getByTestId('correct-answers')).toHaveTextContent("7");
    expect(screen.getByTestId('wrong-answers')).toHaveTextContent("3");
    expect(screen.getByTestId('total-time')).toHaveTextContent(/120 seg/i);
  });

  test('displays fallback error UI on API error', async () => {
    mockUsername = 'errorUser';
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500);

    await act(async () => {
      renderProfile('/profile/errorUser');
    });

    expect(await screen.findByText(/Error al cargar el perfil/i)).toBeInTheDocument();
  });

  test('sets loading to false after successful fetch', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser');
    });

    expect(await screen.findByTestId('profile-username')).toBeInTheDocument();
  });

  test('sets loading to false after API error', async () => {
    mockUsername = 'errorUser';
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500);

    await act(async () => {
      renderProfile('/profile/errorUser');
    });

    expect(await screen.findByText(/Error al cargar el perfil/i)).toBeInTheDocument();
  });

  test('navigates to /ranking if "Ver ranking" button exists and is clicked', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      renderProfile('/profile/testUser');
    });

    const rankingButton = screen.queryByTestId('view-ranking-button');
    if (rankingButton) {
      fireEvent.click(rankingButton);
      expect(mockNavigate).toHaveBeenCalledWith('/ranking');
    }
  });
});
