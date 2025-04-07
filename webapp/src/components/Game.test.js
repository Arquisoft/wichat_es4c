import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';

const mock = new MockAdapter(axios);

describe("Game Component", () => {
  beforeEach(() => {
    mock.reset();
  });

  test("Renderiza correctamente el juego", async () => {
    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Francia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "París",
      type: "capital",
      image: null
    });

    await act(async () => {
      render(<Game />);
    });

    await waitFor(() => {
      expect(screen.getByText("Tiempo restante:")).toBeInTheDocument();
    });
  });

  test("Carga una pregunta desde la API y la muestra", async () => {
    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de España?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Madrid",
      type: "capital",
      image: null
    });

    await act(async () => {
      render(<Game />);
    });

    await waitFor(() => {
      expect(screen.getByText("¿Cuál es la capital de España?")).toBeInTheDocument();
    });

    expect(screen.getByText("Madrid")).toBeInTheDocument();
    expect(screen.getByText("París")).toBeInTheDocument();
  });

  test("Permite seleccionar una respuesta y muestra feedback correcto", async () => {
    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Italia?",
      choices: ["Madrid", "París", "Londres", "Roma"],
      answer: "Roma",
      type: "capital",
      image: null
    });

    await act(async () => {
      render(<Game />);
    });

    const option = await screen.findByText("Roma");

    await act(async () => {
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText("✅")).toBeInTheDocument();
    });
  });

  test("Muestra la respuesta correcta si el usuario falla", async () => {
    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Alemania?",
      choices: ["Madrid", "Berlín", "Londres", "Roma"],
      answer: "Berlín",
      type: "capital",
      image: null
    });

    await act(async () => {
      render(<Game />);
    });

    const incorrectOption = await screen.findByText("Madrid");

    await act(async () => {
      fireEvent.click(incorrectOption);
    });

    await waitFor(() => {
      expect(screen.getByText("❌")).toBeInTheDocument();
      expect(screen.getByText("La respuesta correcta era: Berlín ✅")).toBeInTheDocument();
    });
  });

  test("Muestra tiempo agotado cuando el temporizador termina", async () => {
    jest.useFakeTimers();

    mock.onGet("http://localhost:8000/question").reply(200, {
      question: "¿Cuál es la capital de Portugal?",
      choices: ["Lisboa", "Madrid", "París", "Roma"],
      answer: "Lisboa",
      type: "capital",
      image: null
    });

    await act(async () => {
      render(<Game />);
    });

    await act(async () => {
      jest.advanceTimersByTime(11000);
    });

    await waitFor(() => {
      expect(screen.getByText("⏳ Tiempo agotado")).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
