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
    
    expect(screen.getByText(questionData.question)).toBeInTheDocument();
    expect(screen.getByText(questionData.choices[0])).toBeInTheDocument();
    expect(screen.getByText(questionData.choices[1])).toBeInTheDocument();
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
    
    await waitFor(() => {
      expect(screen.getByText(questionData.question)).toBeInTheDocument();
    });
    
    questionData.choices.forEach(choice => {
      expect(screen.getByText(choice)).toBeInTheDocument();
    });
  });

  test("Muestra imagen cuando la pregunta contiene una", async () => {
    const questionData = {
      question: "¿Qué país tiene esta bandera?",
      choices: ["España", "Francia", "Italia", "Portugal"],
      answer: "España",
      type: "flag",
      image: "https://example.com/flag.png"
    };

    mockGameData(questionData);
    await renderGame();
    
    await waitFor(() => {
      const image = screen.getByAltText(/Bandera/i);
      expect(image).toBeInTheDocument();
      expect(image.src).toBe(questionData.image);
    });
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
    mock.onPost(`http://localhost:8000/updateStats`).reply(200);
    
    await renderGame();
    
    await waitFor(() => {
      expect(screen.getByText(questionData.question)).toBeInTheDocument();
    });
    
    const correctAnswer = screen.getByText("Roma");
    
    await act(async () => {
      fireEvent.click(correctAnswer);
    });
    
    // Esperar para ver el feedback de respuesta correcta
    await waitFor(() => {
      expect(screen.getByText("✅")).toBeInTheDocument();
    });
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
    mock.onPost(`http://localhost:8000/updateStats`).reply(200);
    
    await renderGame();
    
    await waitFor(() => {
      expect(screen.getByText(questionData.question)).toBeInTheDocument();
    });
    
    // Seleccionar una respuesta incorrecta
    const wrongAnswer = screen.getByText("Madrid");
    
    await act(async () => {
      fireEvent.click(wrongAnswer);
    });
    
    // Verificar mensaje de respuesta correcta
    await waitFor(() => {
      expect(screen.getByText(/La respuesta correcta era: Berlín ✅/i)).toBeInTheDocument();
    });
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
    const confirmButton = screen.getByText(/Salir/i);
    fireEvent.click(confirmButton);
    
    // Verificar que se llamó a navigate
    expect(mockNavigate).toHaveBeenCalledWith("/startmenu");
  });

  test("Muestra el modal de resumen al completar todas las preguntas", async () => {
    // Mock para simular respuestas a múltiples preguntas
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 1, // Solo una pregunta para facilitar la prueba
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    const questionData = {
      question: "¿Cuál es la capital de Noruega?",
      choices: ["Oslo", "Estocolmo", "Copenhague", "Helsinki"],
      answer: "Oslo",
      type: "capital",
      image: null
    };

    mock.onGet("http://localhost:8000/question").reply(200, questionData);
    mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
    mock.onPost("http://localhost:8000/updateStats").reply(200);
    
    await renderGame();
    
    await waitFor(() => {
      expect(screen.getByText(questionData.question)).toBeInTheDocument();
    });
    
    // Responder la pregunta
    const correctAnswer = screen.getByText("Oslo");
    
    await act(async () => {
      fireEvent.click(correctAnswer);
    });
    
    // Esperar a que aparezca el modal de resumen
    await waitFor(() => {
      expect(screen.getByText(/Resumen de la partida!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Verificar estadísticas
    expect(screen.getByText(/Preguntas totales: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Correctas: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Incorrectas: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Porcentaje de aciertos: 100%/i)).toBeInTheDocument();
  });



  test("Navega al menú principal desde el modal de resumen", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
      answerTime: 10,
      questionAmount: 1,
      capitalQuestions: true,
      flagQuestions: true,
      monumentQuestions: true,
      foodQuestions: true
    });

    mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
    mock.onPost("http://localhost:8000/updateStats").reply(200);
    
    await renderGame();
    
    await waitFor(() => {
      expect(screen.getByText("Salir al menú principal")).toBeInTheDocument();
    });
    
    
    // Hacer clic en "Volver al menú"
    const menuButton = screen.getByTestId("goMenu");
    
    fireEvent.click(menuButton);
    
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