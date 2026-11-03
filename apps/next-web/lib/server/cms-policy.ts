import { frappeRequest, jsonFromFrappe } from "@/lib/server/frappe-cms";

export interface CmsCapabilities {
  read: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
  publish: boolean;
  unpublish: boolean;
  review: boolean;
  manage_seo: boolean;
  bulk_actions: boolean;
  use_editor_tools: boolean;
}

export interface CmsProfile {
  user: string;
  full_name: string;
  roles: string[];
  capabilities: CmsCapabilities;
}

const REVIEW_STATUSES = new Set(["Review", "QA"]);
const PUBLISH_STATUSES = new Set(["Published"]);
const RETIRE_STATUSES = new Set(["Retired", "Rejected"]);
const SEO_FIELDS = [
  "seo_title",
  "meta_description",
  "canonical_url",
  "primary_keyword",
  "featured_image",
  "noindex",
];

const DEFAULT_CAPABILITIES: CmsCapabilities = {
  read: false,
  create: false,
  write: false,
  delete: false,
  publish: false,
  unpublish: false,
  review: false,
  manage_seo: false,
  bulk_actions: false,
  use_editor_tools: false,
};

export async function loadCmsProfile(
  sessionId: string,
  clientIp?: string | null
): Promise<CmsProfile> {
  const response = await frappeRequest(
    "/api/method/gop.api.cms_profile",
    {},
    sessionId,
    clientIp
  );
  const payload = await jsonFromFrappe(response);
  const profile = (payload.message || {}) as Partial<CmsProfile>;
  const capabilities = {
    ...DEFAULT_CAPABILITIES,
    ...((profile.capabilities || {}) as Partial<CmsCapabilities>),
  };

  return {
    user: String(profile.user || ""),
    full_name: String(profile.full_name || profile.user || ""),
    roles: Array.isArray(profile.roles) ? profile.roles.map(String) : [],
    capabilities,
  };
}

function denied(message: string): never {
  throw new Response(message, { status: 403 });
}

/**
 * Server-side editorial policy. The UI hides tools the user cannot use, but
 * this is the authority: Frappe roles decide which workflow transitions and
 * SEO changes are allowed. Only fields that actually change are compared, so
 * a reviewer can still save body edits on an article that already has SEO
 * values set.
 */
export function assertArticlePolicy(
  profile: CmsProfile,
  payload: Record<string, unknown>,
  previous?: Record<string, unknown> | null
) {
  const capabilities = profile.capabilities;
  const nextStatus = typeof payload.status === "string" ? payload.status : null;
  const previousStatus =
    previous && typeof previous.status === "string" ? previous.status : null;

  if (nextStatus && nextStatus !== previousStatus) {
    if (PUBLISH_STATUSES.has(nextStatus) && !capabilities.publish) {
      denied("Your role cannot publish articles.");
    }
    if (RETIRE_STATUSES.has(nextStatus) && !capabilities.unpublish) {
      denied("Your role cannot retire or reject articles.");
    }
    if (REVIEW_STATUSES.has(nextStatus) && !capabilities.review) {
      denied("Your role cannot move articles into review.");
    }
  }

  const seoChanged = SEO_FIELDS.some(
    (field) => field in payload && payload[field] !== previous?.[field]
  );
  if (seoChanged && !capabilities.manage_seo) {
    denied("Your role cannot change SEO or media fields.");
  }

  if (!capabilities.write) {
    denied("Your role cannot edit articles.");
  }
}
