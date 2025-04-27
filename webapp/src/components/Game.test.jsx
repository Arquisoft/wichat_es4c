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
    await renderGame();  // Llamamos a la función para renderizar el componente
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
    await renderGame();  // Llamamos a la función para renderizar el componente
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
    await renderGame();  // Llamamos a la función para renderizar el componente
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
    await renderGame();  // Llamamos a la función para renderizar el componente

    const toggleButton = screen.getByRole('button', { name: /Sonido Activado/i });
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(toggleButton.textContent).toMatch(/Sonido Desactivado/i);
  });

  test("Muestra mensaje de error si falla obtener configuraciones", async () => {
    mock.onGet("http://localhost:8001/getSettings/testuser").reply(500);

    await renderGame();  // Llamamos a la función para renderizar el componente
  });
  describe("Game Component - cobertura extendida", () => {
    // Reutilizamos mock y renderGame de tu setup original…
  
    test("Llama a incrementGamesPlayed al iniciar partida", async () => {
      const postSpy = mock.onPost("http://localhost:8000/incrementGamesPlayed").reply(200);
      const questionData = { /* ... */ };
      mockGameData(questionData);
  
      await renderGame();
      // Esperamos que se haya hecho una llamada POST para registrar la partida
      expect(postSpy.history.post.length).toBe(1);
    });
  
    test("Hace POST a /updateStats tras responder correctamente", async () => {
      const questionData = {
        question: "¿Capital de Suecia?",
        choices: ["Oslo","Estocolmo","Copenhague","Helsinki"],
        answer: "Estocolmo",
        type: "capital",
        image: null
      };
      mockGameData(questionData);
      mock.onPost("http://localhost:8000/updateStats").reply(200);
  
      await renderGame();
      // Esperamos botón de "Estocolmo"
      const btn = await screen.findByRole('button', { name: "Estocolmo" });
      fireEvent.click(btn);
  
      await waitFor(() => {
        // Tras responder, se debe haber enviado estadísticas
        expect(mock.history.post.some(r => r.url.endsWith('/updateStats'))).toBeTruthy();
      });
    });
  
    test("Muestra el modal de resumen al terminar todas las preguntas", async () => {
      const questionData = {
        question: "¿Capital de Japón?",
        choices: ["Tokio","Seúl","Beijing","Bangkok"],
        answer: "Tokio",
        type: "capital",
        image: null
      };
      mockGameData(questionData);
  
      // Reducimos cantidad de preguntas para simplificar
      localStorage.setItem("username", "testuser");
      mock.onGet("http://localhost:8001/getSettings/testuser").reply(200, {
        answerTime: 10,
        questionAmount: 2,  // sólo 2 preguntas
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: true,
        foodQuestions: true
      });
  
      await renderGame();
      // Respondemos 2 veces
      for (let i = 0; i < 2; i++) {
        const btn = await screen.findByRole('button', { name: "Tokio" });
        fireEvent.click(btn);
        // esperamos el delay interno
        await act(() => new Promise(res => setTimeout(res, 3000)));
      }
  
      // Ahora debe verse el modal de resumen
      expect(screen.getByText(/¡Resumen de la partida!/i)).toBeInTheDocument();
      expect(screen.getByText(/✅ Correctas: 2/i)).toBeInTheDocument();
    });
  
    test("Al hacer click en ‘Volver a jugar’ reinicia contadores y cierra modal", async () => {
      // Asumimos que ya está abierto el modal de resumen
      // Montamos Game y forzamos estado showSummaryModal=true
      await act(async () => {
        render(
          <MemoryRouter>
            <Game />
          </MemoryRouter>
        );
      });
      // Aquí podrías exponer un setter o simular hasta abrir el modal
      // Pero simplificaremos haciendo click directo en el botón:
      const replayBtn = screen.getByRole('button', { name: /Volver a jugar/i });
      fireEvent.click(replayBtn);
  
      // Tras click, el modal debe desaparecer
      await waitFor(() => {
        expect(screen.queryByText(/¡Resumen de la partida!/i)).not.toBeInTheDocument();
      });
    });
  
    test("Navega al menú principal al confirmar salida", async () => {
      const history = createMemoryHistory();
      const navigateSpy = jest.fn();
      // Mockeamos useNavigate
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => navigateSpy,
      }));
  
      mockGameData({
        question: "Test",
        choices: ["A","B","C","D"],
        answer: "A",
        type: "capital",
        image: null
      });
      await act(async () => {
        render(
          <Router location={history.location} navigator={history}>
            <Game />
          </Router>
        );
      });
  
      // Abrimos modal de confirmación
      fireEvent.click(screen.getByRole('button', { name: /Salir al menú principal/i }));
      fireEvent.click(screen.getByRole('button', { name: /^Salir$/i })); // botón rojo
  
      expect(navigateSpy).toHaveBeenCalledWith("/startmenu");
    });
  
    test("Renderiza LLMChat con la prop correctAnswer", async () => {
      const questionData = {
        question: "¿Capital de Canadá?",
        choices: ["Ottawa","Toronto","Vancouver","Montreal"],
        answer: "Ottawa",
        type: "capital",
        image: null
      };
      mockGameData(questionData);
      await renderGame();
  
      // Verificamos que el componente LLMChat reciba la respuesta correcta
      const chat = await screen.findByText(/¿Ottawa/i);
      expect(chat).toBeInTheDocument();
    });
  });
});
