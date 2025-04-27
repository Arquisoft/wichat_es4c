import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Profile from './Profile';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
const mockNavigate = jest.fn();
let mockUsername = 'testUser';

// Mock useNavigate y useParams
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => ({ username: mockUsername }),
  };
});

// Evitamos que window.alert lance error en jsdom
beforeAll(() => {
  window.alert = jest.fn();
});

// Helper para renderizar Profile en /profile/:username
const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={[`/profile/${mockUsername}`]}>
      <Routes>
        <Route path="/profile/:username?" element={<Profile />} />
        <Route path="/startmenu" element={<div>Start Menu</div>} />
        <Route path="/ranking" element={<div>Ranking Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('Profile component — cobertura ampliada', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockNavigate.mockClear();
    localStorage.clear();
    jest.clearAllMocks();
    mockUsername = 'testUser';
  });

  test('redirects to /startmenu if no username in params', async () => {
    mockUsername = '';
    await act(async () => renderProfile());
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

    await act(async () => renderProfile());

    expect(await screen.findByTestId('profile-username')).toHaveTextContent("testUser");
    expect(screen.getByTestId('games-played')).toHaveTextContent("10");
    expect(screen.getByTestId('correct-answers')).toHaveTextContent("7");
    expect(screen.getByTestId('wrong-answers')).toHaveTextContent("3");
    expect(screen.getByTestId('total-time')).toHaveTextContent("120 seg");
  });

  test('displays fallback error UI on API error', async () => {
    mockUsername = 'errorUser';
    mockAxios.onGet(`${apiEndpoint}/profile/errorUser`).reply(500);

    await act(async () => renderProfile());
    expect(await screen.findByText(/Error al cargar el perfil/i)).toBeInTheDocument();
  });

  test('no muestra el drawer de amigos si es perfil ajeno', async () => {
    mockUsername = 'userA';
    localStorage.setItem('username', 'userB');
    mockAxios.onGet(`${apiEndpoint}/profile/userA`).reply(200, {
      username: 'userA',
      gamesPlayed: 1,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });

    await act(async () => renderProfile());
    expect(screen.queryByText(/Amigos/)).not.toBeInTheDocument();
  });

  test('muestra lista de amigos y permite navegar al perfil de uno', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');
    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      username: 'me',
      gamesPlayed: 2,
      correctAnswers: 1,
      wrongAnswers: 1,
      totalTimePlayed: 30,
    });
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' }).reply(200, {
      friends: ['alice', 'bob'],
    });

    await act(async () => renderProfile());
    expect(await screen.findByText('Amigos')).toBeInTheDocument();

    fireEvent.click(screen.getByText('alice'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile/alice');
  });

  test('añade un amigo y refresca la lista', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');

    // Perfil con _id
    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      _id: 'abc123',
      username: 'me',
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });
    // Primera lista vacía
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .replyOnce(200, { friends: [] });
    // Añadir amigo
    mockAxios.onPost(`${apiEndpoint}/addFriend`, {
      userId: 'abc123', friendId: 'newId'
    }).reply(200);
    // Lista con el nuevo amigo
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .replyOnce(200, { friends: ['newFriend'] });

    await act(async () => renderProfile());

    fireEvent.change(screen.getByPlaceholderText('ID del amigo'), {
      target: { value: 'newId' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Añadir amigo/i }));

    expect(await screen.findByText('newFriend')).toBeInTheDocument();
  });

  test('elimina un amigo y muestra lista vacía tras eliminar', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');

    // Perfil con _id
    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      _id: 'abc123',
      username: 'me',
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });
    // Lista con un amigo
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .replyOnce(200, { friends: ['toRemove'] });
    // RemoveFriend genérico
    mockAxios.onPost(`${apiEndpoint}/removeFriend`).reply(200);
    // Lista vacía después
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .replyOnce(200, { friends: [] });

    await act(async () => renderProfile());
    fireEvent.click(screen.getByLabelText('Eliminar amigo'));

    expect(
      await screen.findByText(/No tienes amigos añadidos/i)
    ).toBeInTheDocument();
  });

  test('copia userId al portapapeles al hacer click en 📋', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');
    const fakeId = 'abc123';

    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      _id: fakeId,
      username: 'me',
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .reply(200, { friends: [] });
    navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };

    await act(async () => renderProfile());
    fireEvent.click(screen.getByRole('button', { name: /📋/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(fakeId);
    });
  });

  test('botón "Volver" navega a /startmenu', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');

    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      username: 'me',
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .reply(200, { friends: [] });

    await act(async () => renderProfile());
    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/startmenu');
  });

  test('botón "Ranking" navega a /ranking', async () => {
    mockUsername = 'me';
    localStorage.setItem('username', 'me');

    mockAxios.onGet(`${apiEndpoint}/profile/me`).reply(200, {
      username: 'me',
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTimePlayed: 0,
    });
    mockAxios.onPost(`${apiEndpoint}/friends`, { username: 'me' })
             .reply(200, { friends: [] });

    await act(async () => renderProfile());
    fireEvent.click(screen.getByRole('button', { name: /Ranking/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ranking');

  });
});
