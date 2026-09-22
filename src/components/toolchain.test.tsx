import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

/**
 * Sentinel for the `component` project: proves jsdom, the automatic JSX
 * transform, React 19 rendering, the jest-dom matchers and the `@/` alias are
 * wired up against a real project component.
 */
describe("component toolchain", () => {
  it("renders a project component into jsdom", () => {
    render(<Badge>Pronta entrega</Badge>);
    expect(screen.getByText("Pronta entrega")).toBeInTheDocument();
  });
});
