import { describe, expect, it } from "vitest";
import {
  formatCharging,
  formatClimate,
  formatHours,
  formatOdometer,
  isActivelyReporting,
} from "./format";

describe("isActivelyReporting", () => {
  it("returns true for null (unknown state)", () => {
    expect(isActivelyReporting(null)).toBe(true);
  });

  it("returns true for active states", () => {
    expect(isActivelyReporting("online")).toBe(true);
    expect(isActivelyReporting("driving")).toBe(true);
    expect(isActivelyReporting("charging")).toBe(true);
    expect(isActivelyReporting("updating")).toBe(true);
  });

  it("returns false for inactive states", () => {
    expect(isActivelyReporting("asleep")).toBe(false);
    expect(isActivelyReporting("offline")).toBe(false);
    expect(isActivelyReporting("suspended")).toBe(false);
    expect(isActivelyReporting("")).toBe(false);
  });
});

describe("formatHours", () => {
  it("formats sub-hour durations as minutes", () => {
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(0.25)).toBe("15m");
  });

  it("formats whole hours", () => {
    expect(formatHours(1)).toBe("1h");
    expect(formatHours(2)).toBe("2h");
  });

  it("formats hours with leftover minutes", () => {
    expect(formatHours(1.5)).toBe("1h 30m");
    expect(formatHours(2.25)).toBe("2h 15m");
  });
});

describe("formatCharging", () => {
  const base = {
    chargerPower: null,
    timeToFullCharge: null,
    chargeLimitSoc: null,
    chargingState: null,
  };

  it("returns 'plugged in' when all fields are null", () => {
    expect(formatCharging(base)).toBe("plugged in");
  });

  it("returns the charging state when power and time are null", () => {
    expect(formatCharging({ ...base, chargingState: "Charging" })).toBe(
      "Charging",
    );
  });

  it("shows charger power when present", () => {
    expect(formatCharging({ ...base, chargerPower: 11 })).toBe("11 kW");
  });

  it("shows power and time with 'to full' when no limit is set", () => {
    expect(
      formatCharging({ ...base, chargerPower: 11, timeToFullCharge: 0.5 }),
    ).toBe("11 kW · 30m to full");
  });

  it("shows power and time with 'to X%' when limit is below 100", () => {
    expect(
      formatCharging({
        ...base,
        chargerPower: 11,
        timeToFullCharge: 0.5,
        chargeLimitSoc: 80,
      }),
    ).toBe("11 kW · 30m to 80%");
  });

  it("uses 'to full' when charge limit is exactly 100", () => {
    expect(
      formatCharging({
        ...base,
        chargerPower: 7,
        timeToFullCharge: 1,
        chargeLimitSoc: 100,
      }),
    ).toBe("7 kW · 1h to full");
  });

  it("ignores timeToFullCharge of zero", () => {
    expect(
      formatCharging({ ...base, chargerPower: 11, timeToFullCharge: 0 }),
    ).toBe("11 kW");
  });
});

describe("formatClimate", () => {
  it("returns null when both temps are null", () => {
    expect(formatClimate({ insideTemp: null, outsideTemp: null })).toBeNull();
  });

  it("returns inside temp only when outside is null", () => {
    expect(formatClimate({ insideTemp: 21.3, outsideTemp: null })).toBe(
      "21.3° in",
    );
  });

  it("returns outside temp only when inside is null", () => {
    expect(formatClimate({ insideTemp: null, outsideTemp: 8.0 })).toBe(
      "8.0° out",
    );
  });

  it("returns both temps separated by a dot when both are present", () => {
    expect(formatClimate({ insideTemp: 21.3, outsideTemp: 8.0 })).toBe(
      "21.3° in · 8.0° out",
    );
  });
});

describe("formatOdometer", () => {
  it("rounds and formats with thousands separator", () => {
    expect(formatOdometer(1234.7)).toBe("1,235 km");
    expect(formatOdometer(100000)).toBe("100,000 km");
    expect(formatOdometer(0)).toBe("0 km");
  });
});
