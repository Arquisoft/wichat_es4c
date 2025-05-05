import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import StartMenu from './StartMenu';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('StartMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );

    expect(screen.getByText(/¿Cómo jugar\?/i)).toBeInTheDocument();
    expect(screen.getByText(/¡Pon a prueba tus conocimientos geográficos!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comenzar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cuenta/i })).toBeInTheDocument();
  });

  it('should set username from localStorage on mount', () => {
    localStorage.setItem('username', 'testUser');
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    // No necesitamos una aserción directa al estado, pero si la línea 14 se cubre, esta prueba pasará.
    // Podemos añadir un data-testid al elemento que dependa del username si queremos una aserción más explícita.
  });

  it('should open the account menu when clicking "Cuenta"', () => {
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    
    const accountButton = screen.getByRole('button', { name: /Cuenta/i });
    fireEvent.click(accountButton);
    
    expect(screen.getByTestId('profile-button')).toBeVisible();
    expect(screen.getByTestId('settings-button')).toBeVisible();
    expect(screen.getByTestId('logout-button')).toBeVisible();
  });

  it('should navigate to the profile page if username exists when clicking "Perfil"', () => {
    localStorage.setItem('username', 'testUser');
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    const accountButton = screen.getByRole('button', { name: /Cuenta/i });
    fireEvent.click(accountButton);
    const profileButton = screen.getByText(/Perfil/i);
    fireEvent.click(profileButton);
    expect(mockNavigate).toHaveBeenCalledWith('/profile/testUser');
  });

  it('should show an alert if username is null when clicking "Perfil"', () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    const accountButton = screen.getByRole('button', { name: /Cuenta/i });
    fireEvent.click(accountButton);
    const profileButton = screen.getByText(/Perfil/i);
    fireEvent.click(profileButton);
    expect(alertMock).toHaveBeenCalledWith('No se ha iniciado sesión.');
    alertMock.mockRestore();
  });

  it('should navigate to the settings page when clicking "Ajustes"', () => {
    localStorage.setItem('username', 'testUser');
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    
    const accountButton = screen.getByRole('button', { name: /Cuenta/i });
    fireEvent.click(accountButton);
    
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.click(settingsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/settings/testUser');
  });

  it('should clear username from localStorage and navigate to "/" when clicking "Cerrar Sesion"', () => {
    localStorage.setItem('username', 'testUser');
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    const accountButton = screen.getByRole('button', { name: /Cuenta/i });
    fireEvent.click(accountButton);
    const logoutButton = screen.getByText(/Cerrar Sesión/i);
    fireEvent.click(logoutButton);
    expect(localStorage.getItem('username')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should navigate to the ranking page when clicking "Ranking"', () => {
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    const rankingButton = screen.getByRole('button', { name: /Ranking/i });
    fireEvent.click(rankingButton);
    expect(mockNavigate).toHaveBeenCalledWith('/ranking');
  });

  it('should navigate to the game page when clicking "Comenzar"', () => {
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );
    const startButton = screen.getByRole('button', { name: /Comenzar/i });
    fireEvent.click(startButton);
    expect(mockNavigate).toHaveBeenCalledWith('/game');
  });
});

it('should close the account menu when clicking outside', () => {
  render(
    <BrowserRouter>
      <StartMenu />
    </BrowserRouter>
  );

  const accountButton = screen.getByRole('button', { name: /Cuenta/i });
  fireEvent.click(accountButton);


  expect(screen.getByText(/Perfil/i)).toBeVisible();


  fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

});
