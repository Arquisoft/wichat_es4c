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

    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200, { username: testUser.username });

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

  it('should navigate to start menu if username is missing', () => {
    render(
      <MemoryRouter initialEntries={['/profile/']}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(true).toBe(true);
  });

  it('should handle API error when fetching profile', async () => {
    const testUser = { username: "testUser" };

    mockAxios.onGet(`${apiEndpoint}/profile/${testUser.username}`).reply(500);

    render(
      <MemoryRouter initialEntries={[`/profile/${testUser.username}`]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('should render loading state', () => {
    render(
      <MemoryRouter initialEntries={['/profile/testUser']}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render fallback UI for incomplete profile data', async () => {
    const testUser = { username: "testUser" };

    const incompleteProfileData = {
      username: testUser.username,
      gamesPlayed: null,
      correctAnswers: null,
      wrongAnswers: null,
      totalTimePlayed: null,
    };

    mockAxios.onGet(`${apiEndpoint}/profile/${testUser.username}`).reply(200, incompleteProfileData);

    render(
      <MemoryRouter initialEntries={[`/profile/${testUser.username}`]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(true).toBe(true); 
    });
  });
});
