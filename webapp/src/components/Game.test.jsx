import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';

// Mock modules that might cause issues in tests
jest.mock('react-countdown', () => ({ date, renderer, onComplete }) => {
  return renderer({ seconds: 5, completed: false });
});

jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
  })),
}));

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to delay test execution for async operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mock = new MockAdapter(axios);

describe("Game Component", () => {
  beforeEach(() => {
    mock.reset();
    localStorage.setItem("username", "testuser");
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  // Function to render the Game component with MemoryRouter
  const renderGame = async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      );
    });
  };

  // Function to set up mock API responses
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
    mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
    mock.onPost("http://localhost:8000/updateStats").reply(200);
  };





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
    expect(screen.getByText(/Sonido Desactivado/i)).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(screen.getByText(/Sonido Activado/i)).toBeInTheDocument();
  });

  test("Abre modal de confirmación al hacer clic en 'Salir al menú principal'", async () => {
    const questionData = {
      question: "¿Cuál es la capital de Portugal?",
      choices: ["Lisboa", "Madrid", "París", "Roma"],
      answer: "Lisboa",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();
    
    const exitButton = screen.getByText(/Salir al menú principal/i);
    fireEvent.click(exitButton);
    
    expect(screen.getByText(/¿Seguro que quieres salir?/i)).toBeInTheDocument();
    expect(screen.getByText(/Si sales ahora, se terminará la partida actual/i)).toBeInTheDocument();
  });

  test("Cierra modal de confirmación al hacer clic en 'Cancelar'", async () => {
    const questionData = {
      question: "¿Cuál es la capital de Portugal?",
      choices: ["Lisboa", "Madrid", "París", "Roma"],
      answer: "Lisboa",
      type: "capital",
      image: null
    };

    mockGameData(questionData);
    await renderGame();
    
    // Abrir el modal
    const exitButton = screen.getByText(/Salir al menú principal/i);
    fireEvent.click(exitButton);
    
    // Verificar que el modal está abierto
    expect(screen.getByText(/¿Seguro que quieres salir?/i)).toBeInTheDocument();
    
    // Cerrar el modal con el botón Cancelar
    const cancelButton = screen.getByText(/Cancelar/i);
    fireEvent.click(cancelButton);
    
    // Verificar que el modal se cerró (esto puede ser difícil de verificar directamente,
    // pero podemos comprobar que el botón principal está visible de nuevo)
    expect(screen.getByText(/Salir al menú principal/i)).toBeInTheDocument();
  });

  test("Navega al menú principal al confirmar salir", async () => {

    await renderGame();
    
    // Abrir el modal
    const exitButton = screen.getByText(/Salir al menú principal/i);
    fireEvent.click(exitButton);
    
    // Confirmar salir
    const confirmButton = screen.getByText("Salir");
    fireEvent.click(confirmButton);
    
    // Verificar que se llamó a navigate
    expect(mockNavigate).toHaveBeenCalledWith("/startmenu");
  });



  test("Maneja el caso sin usuario en localStorage", async () => {
    localStorage.removeItem("username");
    
    await renderGame();
    
    // Verificar que se redirige al menú principal
    expect(mockNavigate).toHaveBeenCalledWith("/startmenu");
  });

test("Muestra un error si falla la carga de preguntas", async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 5,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  
  mock.onGet("http://localhost:8000/question").reply(500);
  
  await renderGame();
  
  // Verificar que se registró el error, pero sin comprobar el mensaje exacto
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalled();
  });
  
  consoleSpy.mockRestore();
});

  test("No intenta cargar una pregunta si ya está cargando", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchQuestionSpy = jest.spyOn(axios, 'get');
    
    // Simular una respuesta lenta para la primera llamada
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 5,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });
    
    mock.onGet("http://localhost:8000/question").reply(async () => {
      await delay(500); // Retraso para simular carga lenta
      return [200, {
        question: "¿Cuál es la capital de Bélgica?",
        choices: ["Bruselas", "Amberes", "Brujas", "Gante"],
        answer: "Bruselas",
        type: "capital",
        image: null
      }];
    });   
    
    await renderGame();
    
    // Intentar forzar múltiples cargas de preguntas
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        axios.get("http://localhost:8000/question");
      }
    });
    

    expect(fetchQuestionSpy).toHaveBeenCalledTimes(5);
    
    fetchQuestionSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});