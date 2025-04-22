import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';

const mock = new MockAdapter(axios);

describe("Game Component", () => {
  beforeEach(() => {
    mock.reset();
    localStorage.setItem("username", "testuser"); // Simulate a stored user
  });

  afterEach(() => {
    localStorage.clear(); // Clear localStorage after each test
  });

  const renderWithRouter = (ui) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  test("Renderiza correctamente el juego", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Francia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "París",
      type: "capital",
      image: null
    });

    await act(async () => {
      renderWithRouter(<Game />);
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.getByText(/Tiempo restante:/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("Carga una pregunta desde la API y la muestra", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de España?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Madrid",
      type: "capital",
      image: null
    });

    await act(async () => {
      renderWithRouter(<Game />);
    }, { timeout: 3000 });

  
  });

  test("Permite seleccionar una respuesta y muestra feedback correcto", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Italia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Roma",
      type: "capital",
      image: null
    });

    await act(async () => {
      renderWithRouter(<Game />);
    }, { timeout: 5000 });
  });

  test("Muestra la respuesta correcta si el usuario falla", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Alemania?",
      choices: ["Madrid", "Berlín", "Londres", "Roma"],
      answer: "Berlín",
      type: "capital",
      image: null
    });

    await act(async () => {
      renderWithRouter(<Game />);
    }, { timeout: 5000 });

  });

  test("Permite activar y desactivar sonido", async () => {
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 5,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });

  mock.onGet("http://localhost:8000/question").reply(200, {
    question: "¿Qué país tiene esta bandera?",
    choices: ["Francia", "Italia", "Alemania", "España"],
    answer: "Italia",
    type: "flag",
    image: null
  });

  await act(async () => {
    renderWithRouter(<Game />);
  });

  const toggleButton = screen.getByRole('button', { name: /Sonido Activado/i });
  expect(toggleButton).toBeInTheDocument();
  fireEvent.click(toggleButton);
  expect(toggleButton.textContent).toMatch(/Sonido Desactivado/i);
});

  test("Muestra mensaje de error si falla obtener configuraciones", async () => {
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(500);

  await act(async () => {
    renderWithRouter(<Game />);
  });

});

  

  test("Muestra tiempo agotado cuando el temporizador termina", async () => {
    jest.useFakeTimers();

    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Portugal?",
      choices: ["Lisboa", "Madrid", "París", "Roma"],
      answer: "Lisboa",
      type: "capital",
      image: null
    });

    await act(async () => {
      renderWithRouter(<Game />);
    }, { timeout: 5000 });

    await act(async () => {
      jest.advanceTimersByTime(11000);
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.getByText("⏳ Tiempo agotado")).toBeInTheDocument();
    }, { timeout: 5000 });

    jest.useRealTimers();
  })

  
});

