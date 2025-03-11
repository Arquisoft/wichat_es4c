import React from "react";
import { render, screen, act } from "@testing-library/react";
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

    await act(async () => {
      render(
        <BrowserRouter>
          <Ranking />
        </BrowserRouter>
      );
    });

    expect(await screen.findByText(/player1/i)).toBeInTheDocument();
    expect(await screen.findByText(/player2/i)).toBeInTheDocument();
  });

  it("should display error message when ranking fetch fails", async () => {
    mockAxios.onGet(`${apiEndpoint}/ranking?sortBy=correctAnswers`).reply(500);

    await act(async () => {
      render(
        <BrowserRouter>
          <Ranking />
        </BrowserRouter>
      );
    });

    expect(await screen.findByText(/No se pudo obtener el ranking/i)).toBeInTheDocument();
  });
});
