import assert from "node:assert/strict";
import { test } from "node:test";
import { isSitemapIndexable } from "./sitemap-indexability.ts";

test("only explicitly indexable articles enter the sitemap", () => {
  assert.equal(isSitemapIndexable({ noindex: 0 }), true);
  assert.equal(isSitemapIndexable({ noindex: 1 }), false);
  assert.equal(isSitemapIndexable({ noindex: null }), false);
  assert.equal(isSitemapIndexable({}), false);
});
