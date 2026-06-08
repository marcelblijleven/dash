import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="CPU" value="42%" />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("omits the hint when not provided", () => {
    render(<StatCard title="CPU" value="42%" />);
    expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
  });

  it("renders the hint when provided", () => {
    render(<StatCard title="CPU" value="42%" hint="load: 0.42" />);
    expect(screen.getByText("load: 0.42")).toBeInTheDocument();
  });
});
