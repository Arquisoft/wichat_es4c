import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import StartMenu from './StartMenu';

describe('StartMenu Component', () => {
  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <StartMenu />
      </BrowserRouter>
    );

    expect(screen.getByText(/¿Cómo jugar\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Pon a prueba tu conocimiento/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comenzar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cuenta/i })).toBeInTheDocument();
  });

  

  it('should navigate to the game page when clicking "Comenzar"', () => {
    const router = createMemoryRouter([{ path: '/', element: <StartMenu /> }, { path: '/game', element: <div>Game Page</div> }], { initialEntries: ['/'] });

    render(<RouterProvider router={router} />);

    const startButton = screen.getByRole('button', { name: /Comenzar/i });

    fireEvent.click(startButton);

    expect(screen.getByText(/Game Page/i)).toBeInTheDocument();
  });
});
