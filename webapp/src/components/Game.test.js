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
      expect(screen.getByLabelText(/Paris/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Madrid/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Berlin/i)).toBeInTheDocument();
    });
  });

  it('should submit an answer and show correct feedback', async () => {
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
  });

  it('should submit an answer and show incorrect feedback', async () => {
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

    fireEvent.click(screen.getByLabelText(/Munich/i));
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  it('should fetch a new question when clicking "Siguiente Pregunta"', async () => {
    mockAxios.onGet('http://localhost:8004/question').replyOnce(200, {
      question: 'What is the capital of Italy?',
      choices: ['Rome', 'Milan', 'Naples', 'Turin'],
      answer: 'Rome'
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Italy\?/i)).toBeInTheDocument();
    });

    mockAxios.onGet('http://localhost:8004/question').replyOnce(200, {
      question: 'What is the capital of Japan?',
      choices: ['Tokyo', 'Kyoto', 'Osaka', 'Nagoya'],
      answer: 'Tokyo'
    });

    fireEvent.click(screen.getByRole('button', { name: /Siguiente Pregunta/i }));

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Japan\?/i)).toBeInTheDocument();
    });
  });
});
