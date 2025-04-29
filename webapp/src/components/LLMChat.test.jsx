import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import LLMChat from "./LLMChat";

jest.mock("axios");

describe("LLMChat Component", () => {
  const originalEnv = {
    apiKey: process.env.REACT_APP_LLM_API_KEY,
    gatewayUrl: process.env.REACT_APP_API_GATEWAY_URL
  };

  beforeEach(() => {
    // Configurar entorno para pruebas
    process.env.REACT_APP_API_GATEWAY_URL = 'http://localhost:8000';
    axios.post.mockClear();
  });

  afterEach(() => {
    // Restaurar entorno original
    if (originalEnv.apiKey === undefined) {
      delete process.env.REACT_APP_LLM_API_KEY;
    } else {
      process.env.REACT_APP_LLM_API_KEY = originalEnv.apiKey;
    }
    
    if (originalEnv.gatewayUrl === undefined) {
      delete process.env.REACT_APP_API_GATEWAY_URL;
    } else {
      process.env.REACT_APP_API_GATEWAY_URL = originalEnv.gatewayUrl;
    }
  });

  it("renders correctly", () => {
    render(<LLMChat correctAnswer="España" />);
    expect(screen.getByText("Pregunta a WIChat buddy:")).toBeInTheDocument();
    expect(screen.getByLabelText("Escribe tu pregunta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("allows the user to type a question", () => {
    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    expect(input.value).toBe("¿Cuál es la capital de Francia?");
  });

  it("calls the LLM API through gateway and updates chat history on send", async () => {
    axios.post.mockResolvedValue({ data: { answer: "París" } });
    render(<LLMChat correctAnswer="España" />);

    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    fireEvent.click(button);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/askllm",
      {
        question: "¿Cuál es la capital de Francia?",
        model: "gemini",
        correctAnswer: "España"
      }
    );

    await waitFor(() => {
      expect(screen.getByText("París")).toBeInTheDocument();
      expect(screen.getByText("Pregunta:")).toBeInTheDocument();
      expect(screen.getByText("¿Cuál es la capital de Francia?")).toBeInTheDocument();
      expect(screen.getByText("Respuesta:")).toBeInTheDocument();
      expect(input.value).toBe("");
    });
  });

  it("handles API error and displays error message", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue(new Error("Network Error"));

    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Otra pregunta?" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Error al obtener la respuesta.")).toBeInTheDocument();
      expect(screen.getByText("Pregunta:")).toBeInTheDocument();
      expect(screen.getByText("¿Otra pregunta?")).toBeInTheDocument();
      expect(screen.getByText("Respuesta:")).toBeInTheDocument();
      expect(input.value).toBe("");
    });

    consoleErrorMock.mockRestore();
  });

  it("sends question through gateway when Enter key is pressed", async () => {
    axios.post.mockResolvedValue({ data: { answer: "Respuesta Enter" } });
    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");

    fireEvent.change(input, { target: { value: "Pregunta con Enter" } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/askllm",
      {
        question: "Pregunta con Enter",
        model: "gemini",
        correctAnswer: "España"
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Respuesta Enter")).toBeInTheDocument();
      expect(screen.getByText("Pregunta con Enter")).toBeInTheDocument();
    });
  });

  it("disables send button while loading", async () => {
    let resolvePromise;
    const loadingPromise = new Promise(resolve => { 
      resolvePromise = resolve; 
    });
    axios.post.mockReturnValue(loadingPromise);

    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "Test loading" } });
    fireEvent.click(button);

    // Verificar estado de carga
    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Completar la carga
    await act(async () => {
      resolvePromise({ data: { answer: "Carga completada" } });
      await loadingPromise;
    });

    // Verificar que terminó la carga
    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.getByText("Carga completada")).toBeInTheDocument();
    });
  });
});