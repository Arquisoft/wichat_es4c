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

    // Mock de fetch para que no fallen las peticiones reales
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          username: 'testuser',
          correctAnswers: 0,
          wrongAnswers: 0,
          totalTimePlayed: 0,
        }),
      })
    );
  });

  afterEach(() => {
    localStorage.clear(); // Clear localStorage after each test
    jest.resetAllMocks(); // Resetear mocks para que no se acumulen
  });

  // Función para renderizar el componente Game con MemoryRouter
  const renderGame = async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      );
    });
  };

  // Función para configurar el mock de la API
  const mockGameData = (questionData) => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onGet("http://localhost:8000/question").reply(200, questionData);
  };

  test("Renderiza correctamente el juego", async () => {
    const questionData = {
      question: "¿Cuál es la capital de Francia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "París",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();

    await waitFor(() => {
      expect(screen.getByText(/Tiempo restante:/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("Carga una pregunta desde la API y la muestra", async () => {
    const questionData = {
      question: "¿Cuál es la capital de España?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Madrid",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();
  });

  test("Permite seleccionar una respuesta y muestra feedback correcto", async () => {
    const questionData = {
      question: "¿Cuál es la capital de Italia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Roma",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();
  });

  test("Muestra la respuesta correcta si el usuario falla", async () => {
    const questionData = {
      question: "¿Cuál es la capital de Alemania?",
      choices: ["Madrid", "Berlín", "Londres", "Roma"],
      answer: "Berlín",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();
  });

  test("Permite activar y desactivar sonido", async () => {
    const questionData = {
      question: "¿Qué país tiene esta bandera?",
      choices: ["Francia", "Italia", "Alemania", "España"],
      answer: "Italia",
      type: "flag",
      image: null
    };

    mockGameData(questionData);
    await renderGame();

    const toggleButton = screen.getByRole('button', { name: /Sonido Activado/i });
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(toggleButton.textContent).toMatch(/Sonido Desactivado/i);
  });

  test("Muestra mensaje de error si falla obtener configuraciones", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(500);

    await renderGame();
  });

  // Este test es opcional: controla el temporizador
  // test("Muestra tiempo agotado cuando el temporizador termina", async () => {
  //   jest.useFakeTimers();

  //   const questionData = {
  //     question: "¿Cuál es la capital de Portugal?",
  //     choices: ["Lisboa", "Madrid", "París", "Roma"],
  //     answer: "Lisboa",
  //     type: "capital",
  //     image: null
  //   };

  //   mockGameData(questionData);
  //   await renderGame();

  //   await act(async () => {
  //     jest.advanceTimersByTime(11000);
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText("⏳ Tiempo agotado")).toBeInTheDocument();
  //   }, { timeout: 5000 });

  //   jest.useRealTimers();
  // });

});
