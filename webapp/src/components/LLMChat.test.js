import React from "react"; // Importa React globalmente para el archivo
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import LLMChat from "./LLMChat"; // Importa tu componente aquí arriba

jest.mock("axios"); // Mockea axios globalmente

describe("LLMChat Component", () => {
  // Guarda el valor original de la variable de entorno (si existe) ANTES de todos los tests
  const originalApiKey = process.env.REACT_APP_LLM_API_KEY;
  // Guarda si la variable estaba definida originalmente o no
  const apiKeyWasInitiallyUndefined = originalApiKey === undefined;

  beforeEach(() => {
    // Establece el valor mock ANTES de cada test
    process.env.REACT_APP_LLM_API_KEY = 'test-api-key-123';
    // Limpia el historial de llamadas de axios mock
    axios.post.mockClear();
  });

  afterEach(() => {
    // Restaura el estado original DESPUÉS de cada test
    if (apiKeyWasInitiallyUndefined) {
      // Si no existía al principio, elimínala
      delete process.env.REACT_APP_LLM_API_KEY;
    } else {
      // Si existía, restáurala a su valor original
      process.env.REACT_APP_LLM_API_KEY = originalApiKey;
    }
  });

  // --- Tus tests ---
  // (No necesitas require('./LLMChat').default aquí)

  it("renders correctly", () => {
    render(<LLMChat correctAnswer="España" />); // Renderiza el componente importado
    expect(screen.getByText("Pregunta al LLM")).toBeInTheDocument();
    expect(screen.getByLabelText("Escribe tu pregunta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("allows the user to type a question", () => {
    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    expect(input.value).toBe("¿Cuál es la capital de Francia?");
  });

  it("calls the LLM API and updates chat history on send", async () => {
    axios.post.mockResolvedValue({ data: { answer: "París" } });
    render(<LLMChat correctAnswer="España" />);

    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    fireEvent.click(button);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    // Verifica que la llamada incluye la clave mockeada desde beforeEach
    expect(axios.post).toHaveBeenCalledWith("http://localhost:8003/ask", {
      question: "¿Cuál es la capital de Francia?",
      model: "gemini",
      apiKey: 'test-api-key-123', // <-- Clave mockeada
      correctAnswer: "España",
    });

    await waitFor(() => screen.getByText("París"));
    expect(screen.getByText("Pregunta:")).toBeInTheDocument();
    expect(screen.getAllByText("¿Cuál es la capital de Francia?").length).toBeGreaterThan(0);
    expect(screen.getByText("Respuesta:")).toBeInTheDocument();
    expect(screen.getByText("París"));
    expect(input.value).toBe("");
  });

  it("handles API error and displays error message", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue(new Error("Network Error"));

    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Otra pregunta?" } });
    fireEvent.click(button);

    await waitFor(() => screen.getByText("Error al obtener la respuesta."));
    expect(screen.getByText("Pregunta:")).toBeInTheDocument();
    expect(screen.getAllByText("¿Otra pregunta?").length).toBeGreaterThan(0);
    expect(screen.getByText("Respuesta:")).toBeInTheDocument();
    expect(screen.getByText("Error al obtener la respuesta.")).toBeInTheDocument();
    expect(input.value).toBe("");

    consoleErrorMock.mockRestore();
  });

  it("sends question when Enter key is pressed", async () => {
      axios.post.mockResolvedValue({ data: { answer: "Respuesta Enter" } });
      render(<LLMChat correctAnswer="España" />);
      const input = screen.getByLabelText("Escribe tu pregunta");

      fireEvent.change(input, { target: { value: "Pregunta con Enter" } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8003/ask", expect.objectContaining({
          question: "Pregunta con Enter",
          apiKey: 'test-api-key-123' // <-- Verifica clave mockeada
      }));

      await waitFor(() => screen.getByText("Respuesta Enter"));
      expect(screen.getByText("Pregunta con Enter")).toBeInTheDocument();
  });

  it("disables send button while loading", async () => {
      let resolvePromise;
      const loadingPromise = new Promise(resolve => { resolvePromise = resolve; });
      axios.post.mockReturnValue(loadingPromise);

      render(<LLMChat correctAnswer="España" />);
      const input = screen.getByLabelText("Escribe tu pregunta");
      const button = screen.getByRole("button", { name: "Enviar" });

      fireEvent.change(input, { target: { value: "Test loading" } });
      fireEvent.click(button);

      await waitFor(() => expect(button).toBeDisabled());
      expect(screen.getByRole("progressbar")).toBeInTheDocument();

      await act(async () => {
         resolvePromise({ data: { answer: "Carga completada" } });
         await loadingPromise;
      });

      await waitFor(() => expect(button).not.toBeDisabled());
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.getByText("Carga completada")).toBeInTheDocument();
  });

});