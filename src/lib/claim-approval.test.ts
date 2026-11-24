import { describe, expect, it, vi } from "vitest";
import { approveClaims, canApproveClaim } from "./claim-approval";

const pending = { id: "pending", review_status: "needs_second_review", source_url: "https://www.congreso.es/" };
describe("editorial bulk approval", () => {
  it("selects pending sourced claims but not verified, rejected or unsourced claims", () => {
    expect(canApproveClaim(pending)).toBe(true);
    expect(canApproveClaim({ ...pending, review_status: "auto_extracted_unverified" })).toBe(true);
    expect(canApproveClaim({ ...pending, review_status: "verified_by_human" })).toBe(false);
    expect(canApproveClaim({ ...pending, review_status: "rejected" })).toBe(false);
    expect(canApproveClaim({ ...pending, source_url: null })).toBe(false);
    expect(canApproveClaim({ ...pending, source_url: "javascript:alert(1)" })).toBe(false);
  });
  it("approves all selected pending claims once and excludes deselected claims", async () => {
    const write = vi.fn(async () => "approved" as const);
    const other = { ...pending, id: "other" };
    expect(await approveClaims([pending, other], ["pending", "pending"], write)).toEqual({ approved: 1, skipped: 0, unlogged: 0, failed: 0 });
    expect(write).toHaveBeenCalledExactlyOnceWith(pending);
    write.mockClear();
    await approveClaims([pending, other], [], write);
    expect(write).not.toHaveBeenCalled();
    expect((await approveClaims([pending, other], ["pending", "other"], write)).approved).toBe(2);
  });
  it("reports failed writes and missing audit logs separately from successful approvals", async () => {
    const result = await approveClaims([pending, { ...pending, id: "failed" }, { ...pending, id: "unlogged" }], ["pending", "failed", "unlogged"], async (c) => {
      if (c.id === "failed") throw new Error("denied");
      return c.id === "unlogged" ? "unlogged" : "approved";
    });
    expect(result).toEqual({ approved: 1, skipped: 0, unlogged: 1, failed: 1 });
  });
});