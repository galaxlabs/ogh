import assert from "node:assert/strict";
import { test } from "node:test";
import { cmsMediaUrl } from "./media-url.ts";

test("resolves Frappe uploads without changing existing absolute or local asset URLs", () => {
  const previous = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  process.env.NEXT_PUBLIC_ADMIN_API_URL = "https://cms.example.test/";
  try {
    assert.equal(cmsMediaUrl("/files/cover.png"), "https://cms.example.test/files/cover.png");
    assert.equal(cmsMediaUrl("https://example.test/cover.png"), "https://example.test/cover.png");
    assert.equal(cmsMediaUrl("/images/placeholder.svg"), "/images/placeholder.svg");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_ADMIN_API_URL;
    else process.env.NEXT_PUBLIC_ADMIN_API_URL = previous;
  }
});
