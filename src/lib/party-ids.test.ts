import { describe, expect, it } from "vitest";
import { localPartyId } from "./party-ids";

describe("localPartyId", () => {
  it("maps EH Bildu", () => expect(localPartyId("eh-bildu")).toBe("ehbildu"));
  it("maps Coalición Canaria", () => expect(localPartyId("coalicion-canaria")).toBe("cc"));
  it("keeps known ids", () => expect(localPartyId("pp")).toBe("pp"));
});
