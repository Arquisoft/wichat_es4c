import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsCard from './Settings';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useNavigate y useParams
const mockedNavigate = jest.fn();
let mockedUsername = 'testuser';

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
    useParams: () => ({ username: mockedUsername }),
  };
});

describe('SettingsCard Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockedNavigate.mockClear();
    mockedUsername = 'testuser'; // Reset username antes de cada test
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/settings/testuser']}>
        <Routes>
          <Route path="/settings/:username" element={<SettingsCard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('renders the settings form correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true,
      })
    });

    await act(async () => {
      renderComponent();
    });

    expect(await screen.findByText('Ajustes del Juego')).toBeInTheDocument();
  });

  test('loads user settings on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await act(async () => {
      renderComponent();
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8001/getSettings/testuser');
  });

  test('handles form input changes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await act(async () => {
      renderComponent();
    });

    const answerTimeInput = await screen.findByLabelText(/Tiempo de respuesta/i);
    fireEvent.change(answerTimeInput, { target: { value: 25 } });
    expect(answerTimeInput.value).toBe("25");
  });

  test('prevents setting questionAmount > 40', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await act(async () => {
      renderComponent();
    });

    const questionAmountInput = await screen.findByLabelText(/Cantidad de preguntas/i);
    fireEvent.change(questionAmountInput, { target: { value: 50 } });
    expect(questionAmountInput.value).not.toBe("50");
  });

  test('saves settings when Save button is clicked', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ success: true })
      });

    await act(async () => {
      renderComponent();
    });

    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('navigates back when "Volver" button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await act(async () => {
      renderComponent();
    });

    fireEvent.click(screen.getByText('Volver'));

    expect(mockedNavigate).toHaveBeenCalledWith('/startmenu');
  });

  test('handles failed API response (non-OK status)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      renderComponent();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test('redirects to startmenu if username is not provided', async () => {
    mockedUsername = ''; // Simula username vacío

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings/:username" element={<SettingsCard />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(mockedNavigate).toHaveBeenCalledWith('/startmenu');
  });
});
