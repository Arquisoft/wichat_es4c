import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import Game from "./Game";

const mockAxios = new MockAdapter(axios);

describe("Game Component", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it("should fetch and display a question with an image", async () => {
    mockAxios.onGet("http://localhost:8004/question").reply(200, {
      question: "What is the capital of France?",
      choices: ["Paris", "Madrid", "Rome", "Berlin"],
      answer: "Paris",
      image: "https://example.com/paris.jpg",
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    expect(screen.getByText(/Cargando pregunta/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of France\?/i)).toBeInTheDocument();
      expect(screen.getByAltText(/question image/i)).toHaveAttribute("src", "https://example.com/paris.jpg");
    });
  });

  it("should allow selecting an answer and submitting", async () => {
    mockAxios.onGet("http://localhost:8004/question").reply(200, {
      question: "What is the capital of Spain?",
      choices: ["Lisbon", "Madrid", "Barcelona", "Seville"],
      answer: "Madrid",
    });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Spain\?/i)).toBeInTheDocument();
    });

    const madridOption = screen.getByLabelText(/Madrid/i);
    fireEvent.click(madridOption);
    expect(madridOption).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /Enviar Respuesta/i }));

    await waitFor(() => {
      expect(screen.getByText("✅")).toBeInTheDocument();
    });
  });

  it("should not allow selecting a new answer after submission", async () => {
    mockAxios.onGet("http://localhost:8004/question").reply(200, {
      question: "What is the capital of Spain?",
      choices: ["Lisbon", "Madrid", "Barcelona", "Seville"],
      answer: "Madrid",
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
    fireEvent.click(screen.getByRole("button", { name: /Enviar Respuesta/i }));

    await waitFor(() => {
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Barcelona/i));
    expect(screen.getByLabelText(/Barcelona/i)).not.toBeChecked();
  });

  it("should show an error message if the question fails to load", async () => {
    mockAxios.onGet("http://localhost:8004/question").reply(500);

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar la pregunta/i)).toBeInTheDocument();
    });
  });

  it("should load a new question after clicking 'Next Question'", async () => {
    mockAxios
      .onGet("http://localhost:8004/question")
      .replyOnce(200, {
        question: "What is the capital of Italy?",
        choices: ["Rome", "Milan", "Naples", "Turin"],
        answer: "Rome",
      })
      .onGet("http://localhost:8004/question")
      .replyOnce(200, {
        question: "What is the capital of Germany?",
        choices: ["Berlin", "Munich", "Hamburg", "Frankfurt"],
        answer: "Berlin",
      });

    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Italy\?/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Siguiente Pregunta/i }));

    await waitFor(() => {
      expect(screen.getByText(/What is the capital of Germany\?/i)).toBeInTheDocument();
    });
  });
});
