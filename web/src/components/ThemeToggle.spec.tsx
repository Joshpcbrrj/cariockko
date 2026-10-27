import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  window.localStorage.removeItem("cariockko-theme");
});

describe("ThemeToggle", () => {
  it("switches between light and dark modes and persists the selection", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Ativar modo escuro" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("cariockko-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Ativar modo claro" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ativar modo claro" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("cariockko-theme")).toBe("light");
  });

  it("synchronizes the toggle with a saved dark preference", async () => {
    window.localStorage.setItem("cariockko-theme", "dark");
    document.documentElement.classList.add("dark");

    render(<ThemeToggle mobile />);

    expect(await screen.findByRole("button", { name: "Ativar modo claro" })).toBeInTheDocument();
  });
});
