import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { BrowserRouter } from "react-router-dom";
import Ranking from "./Ranking";

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

describe("Ranking component", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it("should display the ranking list", async () => {
    const mockRanking = [
      { username: "player1", gamesPlayed: 20, correctAnswers: 15, wrongAnswers: 5, totalTimePlayed: 300 },
      { username: "player2", gamesPlayed: 18, correctAnswers: 12, wrongAnswers: 6, totalTimePlayed: 250 },
    ];

    mockAxios.onGet(`${apiEndpoint}/ranking?sortBy=correctAnswers`).reply(200, mockRanking);

    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/player1/i)).toBeInTheDocument();
      expect(screen.getByText(/player2/i)).toBeInTheDocument();
      expect(screen.getByText(/20/i)).toBeInTheDocument();
      expect(screen.getByText(/15/i)).toBeInTheDocument();
      expect(screen.getByText(/5/i)).toBeInTheDocument();
      expect(screen.getByText(/300 seg/i)).toBeInTheDocument();
    });
  });

  it("should allow sorting by different criteria", async () => {
    const mockRanking = [
      { username: "player1", gamesPlayed: 10, correctAnswers: 8, wrongAnswers: 2, totalTimePlayed: 200 },
    ];

    mockAxios.onGet(`${apiEndpoint}/ranking?sortBy=gamesPlayed`).reply(200, mockRanking);

    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );

    const sortSelect = screen.getByText(/Ordenar por/i).closest("div").querySelector("select");

    fireEvent.change(sortSelect, { target: { value: "gamesPlayed" } });

    await waitFor(() => {
      expect(screen.getByText(/player1/i)).toBeInTheDocument();
      expect(screen.getByText(/10/i)).toBeInTheDocument();
    });
  });

  it("should display error message when fetching ranking fails", async () => {
    mockAxios.onGet(`${apiEndpoint}/ranking?sortBy=correctAnswers`).reply(500, { error: "No se pudo obtener el ranking" });

    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No se pudo obtener el ranking/i)).toBeInTheDocument();
    });
  });
});
