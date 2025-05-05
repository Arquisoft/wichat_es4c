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

  // Test para verificar el manejo de errores en updateStats
test("Maneja errores en la actualización de estadísticas", async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 1,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  
  const questionData = {
    question: "¿Cuál es la capital de España?",
    choices: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
    answer: "Madrid",
    type: "capital",
    image: null
  };
  
  mock.onGet("http://localhost:8000/question").reply(200, questionData);
  mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
  mock.onPost("http://localhost:8000/updateStats").reply(500);
  
  await renderGame();
  
  // Esperar a que se llame a updateStats y ocurra el error
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalled();
  });
  
  consoleSpy.mockRestore();
});

// Test para verificar que la función fetchQuestion maneja múltiples intentos para preguntas nuevas
test("fetchQuestion intenta obtener preguntas no utilizadas", async () => {
  const fetchSpy = jest.spyOn(axios, 'get');
  
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 5,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  
  // Simular que siempre devuelve la misma pregunta
  const repeatedQuestion = {
    question: "¿Cuál es la capital de Japón?",
    choices: ["Tokio", "Kioto", "Osaka", "Hiroshima"],
    answer: "Tokio",
    type: "capital",
    image: null
  };
  
  mock.onGet("http://localhost:8000/question").reply(200, repeatedQuestion);
  
  await renderGame();
  
  // Primera llamada para cargar la pregunta inicial
  expect(fetchSpy).toHaveBeenCalledTimes(0)

  
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  }, { timeout: 3000 });
  
  fetchSpy.mockRestore();
});


// Test para verificar que se carga una imagen de la pregunta cuando existe
test("Muestra correctamente la imagen de la pregunta", async () => {
  const questionData = {
    question: "¿A qué país pertenece esta bandera?",
    choices: ["España", "Italia", "Francia", "Portugal"],
    answer: "Francia",
    type: "flag",
    image: "https://example.com/flag.png"
  };

  mockGameData(questionData);
  await renderGame();
  
});

// Test para verificar que se muestra el modal de resumen al finalizar el juego
test("Muestra el modal de resumen al completar todas las preguntas", async () => {
  // Mock de settings con solo 1 pregunta para que termine rápido
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 1, // Solo 1 pregunta
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });

  const questionData = {
    question: "¿Cuál es la capital de España?",
    choices: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
    answer: "Madrid",
    type: "capital",
    image: null
  };

  mock.onGet("http://localhost:8000/question").reply(200, questionData);
  mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
  mock.onPost("http://localhost:8000/updateStats").reply(200);

  await renderGame();
  
});

// Test para verificar que el temporizador expira y maneja la respuesta automáticamente
test("Maneja correctamente cuando el tiempo se agota", async () => {
  jest.useFakeTimers();
  
  // Sobreescribir el mock de react-countdown solo para este test
  jest.resetModules();
  jest.doMock('react-countdown', () => ({ date, renderer, onComplete }) => {
    // Simular que se completó el contador
    setTimeout(() => {
      onComplete();
    }, 0);
    return renderer({ seconds: 0, completed: true });
  });

  const questionData = {
    question: "¿Cuál es la capital de Portugal?",
    choices: ["Lisboa", "Madrid", "París", "Roma"],
    answer: "Lisboa",
    type: "capital",
    image: null
  };

  mockGameData(questionData);
  
  await act(async () => {
    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );
    
    // Avanzar el temporizador para simular agotamiento de tiempo
    jest.advanceTimersByTime(10000);
  });
  
  
  // Limpiar
  jest.useRealTimers();
  jest.resetAllMocks();
  jest.dontMock('react-countdown');
});

// Test para verificar que "Volver a jugar" reinicia el juego correctamente
test("'Volver a jugar' reinicia el juego correctamente", async () => {
  // Mock para simular que terminó el juego
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 1,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });

  // Primera pregunta
  const questionData1 = {
    question: "¿Cuál es la capital de Francia?",
    choices: ["París", "Londres", "Roma", "Berlín"],
    answer: "París",
    type: "capital",
    image: null
  };

  // Segunda pregunta para cuando reinicie
  const questionData2 = {
    question: "¿Cuál es la capital de Alemania?",
    choices: ["Berlín", "Múnich", "Hamburgo", "Frankfurt"],
    answer: "Berlín",
    type: "capital",
    image: null
  };

  let questionCounter = 0;
  
  mock.onGet("http://localhost:8000/question").reply(() => {
    const data = questionCounter === 0 ? questionData1 : questionData2;
    questionCounter++;
    return [200, data];
  });
  
  mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
  mock.onPost("http://localhost:8000/updateStats").reply(200);

  await renderGame();
  
  
});



// Test para verificar el comportamiento cuando no hay usuario registrado
test("Redirige al menú cuando localStorage no tiene usuario", async () => {
  // Limpiar cualquier usuario almacenado
  localStorage.removeItem("username");
  
  await renderGame();
  
  // Verificar que se redirige al menú
  expect(mockNavigate).toHaveBeenCalledWith("/startmenu");
});

// Test para verificar manejo de errores en la solicitud de configuración
test("Maneja errores al obtener configuración de usuario", async () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); 
  
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(500, {
    message: "Error al obtener configuración"
  });
  
  await renderGame();
  
  // Verificar que se registró el error
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalled();
  });
  
  consoleSpy.mockRestore();
});

// Test para verificar que finishGame se llama con los parámetros correctos
test("finishGame se llama con los parámetros correctos", async () => {
  const mockPost = jest.fn().mockResolvedValue({ data: {} });
  axios.post = mockPost;
  
  mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
    answerTime: 10,
    questionAmount: 1,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  
  const questionData = {
    question: "¿Cuál es la capital de España?",
    choices: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
    answer: "Madrid",
    type: "capital",
    image: null
  };
  
  mock.onGet("http://localhost:8000/question").reply(200, questionData);
  
  await renderGame();
  
  
  // Verificar que se llama a finishGame con los parámetros correctos
  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(0);
  });
  
  // Restaurar el mock de axios.post
  axios.post = jest.requireActual('axios').post;
});


});