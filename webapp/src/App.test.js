import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";


jest.mock("./Router", () => () => <div data-testid="app-router">AppRouter</div>);

describe("App Component", () => {
  test("Renderiza correctamente CssBaseline", () => {
    render(<App />);
    expect(document.querySelector("style")).toBeInTheDocument();
  });

  test("Renderiza correctamente el Router", () => {
    render(<App />);
    expect(screen.getByTestId("app-router")).toBeInTheDocument();
  });
});
