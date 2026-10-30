import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvField } from "@/lib/csv";

describe("escapeCsvField", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvField("Amara Silva")).toBe("Amara Silva");
    expect(escapeCsvField(75.5)).toBe("75.5");
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("quotes commas, quotes, and newlines", () => {
    expect(escapeCsvField("Silva, Amara")).toBe('"Silva, Amara"');
    expect(escapeCsvField('He said "hello"')).toBe('"He said ""hello"""');
    expect(escapeCsvField("line one\nline two")).toBe('"line one\nline two"');
    expect(escapeCsvField("line one\r\nline two")).toBe('"line one\r\nline two"');
  });

  it("neutralises spreadsheet formulas", () => {
    for (const value of ["=SUM(A1:A2)", "+60123456789", "-1+2", "@user", "\tcmd"]) {
      expect(escapeCsvField(value).startsWith("'")).toBe(true);
    }
    expect(escapeCsvField("=A1,B1")).toBe('"\'=A1,B1"');
    expect(escapeCsvField("\rcmd")).toBe("\"'\rcmd\"");
  });

  it("does not treat interior symbols as formulas", () => {
    expect(escapeCsvField("Total = 5")).toBe("Total = 5");
    expect(escapeCsvField("email@example.com")).toBe("email@example.com");
  });
});

describe("buildCsv", () => {
  const columns = [
    { header: "Customer", value: (row: { name: string; amount: number }) => row.name },
    { header: "Amount", value: (row: { name: string; amount: number }) => row.amount },
  ];

  it("writes a CRLF-terminated header and rows", () => {
    const csv = buildCsv([{ name: "Amara", amount: 75 }], columns);
    expect(csv).toBe("Customer,Amount\r\nAmara,75\r\n");
  });

  it("escapes headers and values", () => {
    const csv = buildCsv(
      [{ name: 'Silva, "Amara"', amount: 0 }],
      [
        { header: "Full name", value: (row) => row.name },
        { header: "Notes = important", value: () => "@handle" },
      ],
    );
    expect(csv).toBe(
      'Full name,Notes = important\r\n"Silva, ""Amara""",\'@handle\r\n',
    );
  });

  it("handles empty datasets", () => {
    expect(buildCsv([], columns)).toBe("Customer,Amount\r\n");
  });
});
