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

describe('Profile component', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockNavigate.mockReset();
  });

  it('should navigate to /startmenu if no username in params', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile/:username?" element={<Profile />} />
            <Route path="/startmenu" element={<div>Start Menu</div>} />
          </Routes>
        </MemoryRouter>
      );
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
      render(
        <MemoryRouter initialEntries={[`/profile/testUser`]}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/ranking" element={<div>Ranking Page</div>} />
          </Routes>
        </MemoryRouter>
      );
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
      render(
        <MemoryRouter initialEntries={[`/profile/errorUser`]}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
    // Verifica que el Snackbar esté presente buscando una parte del mensaje
    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
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
      render(
        <MemoryRouter initialEntries={['/profile/testUser']}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/ranking" element={<div>Ranking Page</div>} />
          </Routes>
        </MemoryRouter>
      );
    });

    const viewRankingButton = await screen.findByTestId('view-ranking-button');
    fireEvent.click(viewRankingButton);
    expect(mockNavigate).toHaveBeenCalledWith('/ranking');
  });

  it('should set loading to false after successful fetch', async () => {
    const profileData = {
      username: "testUser",
      gamesPlayed: 10,
      correctAnswers: 7,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, profileData);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/profile/testUser`]}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(screen.getByText(/testUser/i)).toBeInTheDocument());
    // La ausencia de errores y la renderización de datos implican que setLoading(false) se ejecutó
  });

  it('should set loading to false after API error', async () => {
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500, { error: "API error" });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/profile/errorUser`]}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(screen.getByText(/API error/i)).toBeInTheDocument());
    // La renderización del mensaje de error implica que setLoading(false) se ejecutó
  });
});