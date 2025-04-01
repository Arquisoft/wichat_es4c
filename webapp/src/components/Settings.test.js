import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsCard from './Settings';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ username: 'testuser' }),
}));

describe('SettingsCard Component', () => {
  // Mock the global fetch function before each test
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  // Reset all mocks after each test
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
    // Mock the fetch response for settings
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true
      })
    });

    renderComponent();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Ajustes')).toBeInTheDocument();
    });

    // Check text fields
    expect(screen.getByLabelText('Tiempo de respuesta (s)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad de preguntas')).toBeInTheDocument();

    // Check checkboxes
    expect(screen.getByLabelText('Mostrar preguntas sobre capitales')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar preguntas sobre banderas')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar preguntas sobre monumentos')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar preguntas sobre comida')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  test('loads user settings on mount', async () => {
    // Mock the fetch response for settings
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true
      })
    });

    renderComponent();

    // Wait for the data to load and verify fetch was called correctly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8001/getSettings/testuser');
    });

    // Check that form values are set correctly
    await waitFor(() => {
      expect(screen.getByLabelText('Tiempo de respuesta (s)')).toHaveValue('15');
      expect(screen.getByLabelText('Cantidad de preguntas')).toHaveValue('20');
      expect(screen.getByLabelText('Mostrar preguntas sobre capitales')).toBeChecked();
      expect(screen.getByLabelText('Mostrar preguntas sobre banderas')).toBeChecked();
      expect(screen.getByLabelText('Mostrar preguntas sobre monumentos')).not.toBeChecked();
      expect(screen.getByLabelText('Mostrar preguntas sobre comida')).toBeChecked();
    });
  });

  test('handles form input changes', async () => {
    // Mock the fetch response for settings
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true
      })
    });

    renderComponent();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Tiempo de respuesta (s)')).toHaveValue('15');
    });

    // Change input values
    fireEvent.change(screen.getByLabelText('Tiempo de respuesta (s)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Cantidad de preguntas'), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('Mostrar preguntas sobre monumentos'));

    // Check that form values have changed
    expect(screen.getByLabelText('Tiempo de respuesta (s)')).toHaveValue('25');
    expect(screen.getByLabelText('Cantidad de preguntas')).toHaveValue('30');
    expect(screen.getByLabelText('Mostrar preguntas sobre monumentos')).toBeChecked();
  });

  test('prevents setting questionAmount > 40', async () => {
    // Mock the fetch response for settings
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true
      })
    });

    renderComponent();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByLabelText('Cantidad de preguntas')).toHaveValue('20');
    });

    // Attempt to set value > 40
    fireEvent.change(screen.getByLabelText('Cantidad de preguntas'), { target: { value: '50' } });

    // Should show warning snackbar
    await waitFor(() => {
      expect(screen.getByText('El número máximo de preguntas es 40.')).toBeInTheDocument();
    });

    // Value should remain unchanged
    expect(screen.getByLabelText('Cantidad de preguntas')).toHaveValue('20');
  });

  test('saves settings when Save button is clicked', async () => {
    // Mock the fetch responses for both API calls
    global.fetch
      // First call to getSettings
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          answerTime: 15,
          questionAmount: 20,
          capitalQuestions: true,
          flagQuestions: true,
          monumentQuestions: false,
          foodQuestions: true
        })
      })
      // Second call to saveSettings
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ success: true })
      });

    renderComponent();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Guardar')).toBeInTheDocument();
    });

    // Change some settings
    fireEvent.change(screen.getByLabelText('Tiempo de respuesta (s)'), { target: { value: '25' } });
    
    // Click save button
    fireEvent.click(screen.getByText('Guardar'));

    // Check that API was called with right data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8001/saveSettings/testuser',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
    });

  });


  test('navigates back when "Volver" button is clicked', async () => {
    // Mock the fetch response for settings
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answerTime: 15,
        questionAmount: 20,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: false,
        foodQuestions: true
      })
    });

    const navigateMock = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => navigateMock);

    renderComponent();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Volver')).toBeInTheDocument();
    });

    // Click back button
    fireEvent.click(screen.getByText('Volver'));

    // Check that navigate was called with correct path
    expect(navigateMock).toHaveBeenCalledWith('/startmenu');
  });

  test('handles failed API response (non-OK status)', async () => {
    // Mock failed API response with non-OK status
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    console.error = jest.fn(); // Mock console.error

    renderComponent();

    // Check that error state is handled
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('redirects to startmenu if username is not provided', async () => {
    // Mock empty username
    jest.spyOn(require('react-router-dom'), 'useParams').mockImplementationOnce(() => ({ username: '' }));
    
    const navigateMock = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => navigateMock);

    renderComponent();

    // Should redirect immediately
    expect(navigateMock).toHaveBeenCalledWith('/startmenu');
  });
});