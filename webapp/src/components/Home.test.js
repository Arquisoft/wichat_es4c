import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Component', () => {
  test('renders the Home component with correct content', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Verificar que el título principal se renderiza
    expect(screen.getByText(/Welcome to the 2025 Edition/i)).toBeInTheDocument();

    // Verificar que el subtítulo se renderiza
    expect(screen.getByText(/Software Architecture Course/i)).toBeInTheDocument();

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('applies correct styles to the Home component', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const container = screen.getByTestId('home-container');
    expect(container).toHaveStyle('background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)');

    const paper = screen.getByText(/Welcome to the 2025 Edition/i).closest('div');
    expect(paper).toHaveStyle('color: white');
  });
});