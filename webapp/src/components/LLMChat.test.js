import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import LLMChat from "./LLMChat";
import React from "react";

jest.mock("axios");

describe("LLMChat Component", () => {
  it("renders correctly", () => {
    render(<LLMChat correctAnswer="España" />);
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

    await act(async () => {
      render(<LLMChat correctAnswer="España" />);
    });

    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    fireEvent.click(button);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith("http://localhost:8003/ask", {
      question: "¿Cuál es la capital de Francia?",
      model: "gemini",
      apiKey: undefined,
      correctAnswer: "España",
    });

    await waitFor(() => screen.getByText("París"));
    expect(screen.getByText("Pregunta:")).toBeInTheDocument();
    expect(screen.getByText("¿Cuál es la capital de Francia?"));
    expect(screen.getByText("Respuesta:")).toBeInTheDocument();
    expect(screen.getByText("París"));
  });

  it("handles API error and displays error message", async () => {
    axios.post.mockRejectedValue(new Error("Network Error"));

    render(<LLMChat correctAnswer="España" />);
    const input = screen.getByLabelText("Escribe tu pregunta");
    const button = screen.getByRole("button", { name: "Enviar" });

    fireEvent.change(input, { target: { value: "¿Cuál es la capital de Francia?" } });
    fireEvent.click(button);

    await waitFor(() => screen.getByText("Error al obtener la respuesta."));
    expect(screen.getByText("Pregunta:")).toBeInTheDocument();
    expect(screen.getByText("¿Cuál es la capital de Francia?"));
    expect(screen.getByText("Respuesta:")).toBeInTheDocument();
    expect(screen.getByText("Error al obtener la respuesta."));
  });
});
