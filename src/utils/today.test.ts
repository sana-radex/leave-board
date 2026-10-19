import { describe, it, expect, vi, afterEach } from "vitest";
import { today, now } from "./today";
import { toDateKey } from "./format";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("today", () => {
  it("有設定 VITE_TODAY 就用它", () => {
    vi.stubEnv("VITE_TODAY", "2026-10-19");
    expect(today()).toBe("2026-10-19");
  });

  it("沒設定就用真正的今天", () => {
    vi.stubEnv("VITE_TODAY", "");
    expect(today()).toBe(toDateKey(new Date()));
  });
});

describe("now", () => {
  it("日期部分跟 today() 一致", () => {
    vi.stubEnv("VITE_TODAY", "2026-10-19");
    expect(toDateKey(new Date(now()))).toBe("2026-10-19");
  });
});
