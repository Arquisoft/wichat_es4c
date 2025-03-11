import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { BrowserRouter } from "react-router-dom";
import Profile from "./Profile";

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

describe("Profile component", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it("should display user profile data", async () => {
    const mockUser = {
      username: "testUser",
      gamesPlayed: 5,
      correctAnswers: 10,
      wrongAnswers: 3,
      totalTimePlayed: 120,
    };

    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(200, mockUser);

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/testUser/i)).toBeInTheDocument();
      expect(screen.getByText(/5/i)).toBeInTheDocument();
      expect(screen.getByText(/10/i)).toBeInTheDocument();
      expect(screen.getByText(/3/i)).toBeInTheDocument();
      expect(screen.getByText(/120 seg/i)).toBeInTheDocument();
    });
  });

  it("should display error message when profile fetch fails", async () => {
    mockAxios.onGet(`${apiEndpoint}/profile/testUser`).reply(500);

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No se pudo obtener la información del perfil/i)).toBeInTheDocument();
    });
  });
});
