/**
 * Google Places API (New) — Text Search integration.
 *
 * This is the ONLY place that calls the live Google API. It's invoked
 * by the /api/leads/search route, and only when the cache-freshness
 * check there decides a city+category combination is missing or
 * stale (see CACHE_MAX_AGE_DAYS). Every other search hits our own
 * `leads` table, not this file — that's the cost-control design from
 * the master plan.
 */

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

// Field mask kept deliberately narrow — every extra field on this
// list can move Google's per-request billing into a pricier SKU
// tier, so only request what the leads table actually stores.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "nextPageToken",
].join(",");

// How the UI's category labels map to a natural-language search term.
const CATEGORY_SEARCH_TERM: Record<string, string> = {
  Manufacturing: "manufacturing company",
  "Retail & Trading": "trading company",
  "IT Services & Startups": "IT services company",
  "E-commerce Sellers": "ecommerce company",
  "Real Estate": "real estate developer",
};

// Google returns at most 20 results per page. Pulling 3 pages gives
// a reasonable-sized cached dataset (~60 leads) per city+category
// without turning a single cache refresh into a runaway API bill.
const MAX_PAGES = 3;
const PAGE_DELAY_MS = 2000; // Google requires a short delay before a pageToken becomes valid.

export interface GooglePlaceLead {
  business_name: string;
  phone: string | null;
  email: null; // Google Places never returns email addresses — kept null, matches the Lead type.
  rating: number | null;
  address: string | null;
  website: string | null;
}

interface PlacesApiPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches fresh leads for one city+category combination from Google
 * Places API (New). Throws if GOOGLE_PLACES_API_KEY isn't set or the
 * API call fails — callers decide how to degrade (e.g. fall back to
 * whatever is already cached).
 */
export async function fetchLeadsFromGooglePlaces(
  city: string,
  category: string
): Promise<GooglePlaceLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set — add it to .env.local to enable live data refresh."
    );
  }

  const searchTerm = CATEGORY_SEARCH_TERM[category] ?? category.toLowerCase();
  const textQuery = `${searchTerm} in ${city}, India`;

  const results: PlacesApiPlace[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const body: Record<string, unknown> = pageToken
      ? { textQuery, pageToken }
      : { textQuery, languageCode: "en" };

    const response = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google Places API request failed (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as PlacesApiResponse;
    results.push(...(data.places ?? []));

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
    await sleep(PAGE_DELAY_MS);
  }

  return results.map(toLeadRow);
}

function toLeadRow(place: PlacesApiPlace): GooglePlaceLead {
  return {
    business_name: place.displayName?.text ?? "Unnamed business",
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null,
    email: null,
    rating: typeof place.rating === "number" ? place.rating : null,
    address: place.formattedAddress ?? null,
    website: place.websiteUri ?? null,
  };
}
