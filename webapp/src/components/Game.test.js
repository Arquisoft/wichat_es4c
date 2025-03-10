import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';

const mockAxios = new MockAdapter(axios);

describe('Game Component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('should fetch and display a question', async () => {
    mockAxios.onGet('http://localhost:8004/question').reply(200, {
      question: 'What is the capital of France?',
      choices: ['Paris', 'Madrid', 'Rome', 'Berlin'],
      answer: 'Paris',
      image: 'https://example.com/paris.jpg'
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    expect(screen.getByText(/Cargando pregunta/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of France\?/i)).toBeInTheDocument();
    });
  });

  it('should not allow selecting a new answer after submission', async () => {
    mockAxios.onGet('http://localhost:8004/question').reply(200, {
      question: 'What is the capital of Spain?',
      choices: ['Lisbon', 'Madrid', 'Barcelona', 'Seville'],
      answer: 'Madrid'
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Spain\?/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Madrid/i));
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    await waitFor(() => {
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Barcelona/i));
    expect(screen.getByLabelText(/Barcelona/i)).not.toBeChecked();
  });

  it('should disable "Siguiente Pregunta" until an answer is submitted', async () => {
    mockAxios.onGet('http://localhost:8004/question').reply(200, {
      question: 'What is the capital of Germany?',
      choices: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
      answer: 'Berlin'
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Germany\?/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Siguiente Pregunta/i });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Berlin/i));
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    await waitFor(() => {
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
    });
  });
});
