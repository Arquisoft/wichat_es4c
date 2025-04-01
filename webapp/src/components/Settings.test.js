import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import SettingsCard from './Settings';

const mockAxios = new MockAdapter(axios);

describe('Settings Component', () => {
  const mockUsername = 'testUser';

  beforeEach(() => {
    mockAxios.reset();
    localStorage.setItem('username', mockUsername);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should fetch and display user settings', async () => {
    mockAxios.onGet(`http://localhost:8001/getSettings/${mockUsername}`).reply(200, {
      answerTime: 15,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: false,
      monumentQuestions: true,
      foodQuestions: false,
    });

    render(
      <BrowserRouter>
        <SettingsCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Tiempo de respuesta/i)).toHaveValue(15);
      expect(screen.getByLabelText(/Cantidad de preguntas/i)).toHaveValue(5);
      expect(screen.getByLabelText(/Mostrar preguntas sobre capitales/i)).toBeChecked();
      expect(screen.getByLabelText(/Mostrar preguntas sobre banderas/i)).not.toBeChecked();
    });
  });

  it('should save settings when the save button is clicked', async () => {
    mockAxios.onGet(`http://localhost:8001/getSettings/${mockUsername}`).reply(200, {
      answerTime: 15,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: false,
      monumentQuestions: true,
      foodQuestions: false,
    });

    mockAxios.onPost(`http://localhost:8001/saveSettings/${mockUsername}`).reply(200);

    render(
      <BrowserRouter>
        <SettingsCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Tiempo de respuesta/i)).toHaveValue(15);
    });

    fireEvent.change(screen.getByLabelText(/Tiempo de respuesta/i), { target: { value: 20 } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.settings.answerTime).toBe(20);
    });

    expect(screen.getByText(/¡Guardado con éxito!/i)).toBeInTheDocument();
  });

  it('should show a warning if question amount exceeds the limit', async () => {
    mockAxios.onGet(`http://localhost:8001/getSettings/${mockUsername}`).reply(200, {
      answerTime: 15,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: false,
      monumentQuestions: true,
      foodQuestions: false,
    });

    render(
      <BrowserRouter>
        <SettingsCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Cantidad de preguntas/i)).toHaveValue(5);
    });

    fireEvent.change(screen.getByLabelText(/Cantidad de preguntas/i), { target: { value: 50 } });

    await waitFor(() => {
      expect(screen.getByText(/El número máximo de preguntas es 40/i)).toBeInTheDocument();
    });
  });

  it('should navigate back to the start menu when the back button is clicked', async () => {
    mockAxios.onGet(`http://localhost:8001/getSettings/${mockUsername}`).reply(200, {
      answerTime: 15,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: false,
      monumentQuestions: true,
      foodQuestions: false,
    });

    const { container } = render(
      <BrowserRouter>
        <SettingsCard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Tiempo de respuesta/i)).toHaveValue(15);
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));

    expect(container.innerHTML).toContain('startmenu');
  });
});
