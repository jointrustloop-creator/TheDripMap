// Pillar 4 of the IV-clinic SEO audit: ready-to-paste JSON-LD schema generator.
//
// No LLM, no external API — a pure template. Takes the detected NAP, services,
// and city from the crawl and emits a `MedicalClinic` JSON-LD block (with
// LocalBusiness fallback fields). The UI surfaces this with a one-click copy
// button so the clinic owner can paste it straight into their <head>.
//
// We are deliberately conservative: every field is sourced from real detected
// data. If a field can't be confidently filled (no address parsed, no phone in
// the HTML), it is omitted entirely rather than faked.

export interface SchemaInput {
  /** Detected clinic business name (from <title>, og:site_name, or H1). */
  name: string;
  /** Final URL of the homepage we crawled. */
  url: string;
  /** Detected or user-supplied city. May be empty. */
  city: string;
  /** Detected or user-supplied state/region. May be empty. */
  state?: string;
  /** Detected phone (E.164 preferred) — or empty if none found. */
  phone?: string;
  /** Detected street address — or empty if none found. */
  streetAddress?: string;
  /** Detected postal code — or empty if none found. */
  postalCode?: string;
  /** Detected primary services (e.g. "NAD+ therapy", "Myers Cocktail"). */
  services: string[];
  /** Detected meta description, used as the schema `description`. */
  description?: string;
  /** Detected og:image, used as the schema `image`. */
  image?: string;
  /** Two-letter country code, default "US". */
  country?: string;
}

export interface GeneratedSchema {
  /** The JSON-LD object (already shaped for paste). */
  jsonLd: Record<string, unknown>;
  /** Pretty-printed string the UI shows in the textarea + copy button. */
  scriptTag: string;
  /** Which fields we omitted because they couldn't be confidently detected. */
  missingFields: string[];
  /** Plain-English notes for the report so the owner knows why some fields are blank. */
  notes: string[];
}

function clean(v?: string): string {
  return (v || '').trim();
}

/**
 * Build a `MedicalClinic` JSON-LD block. We use `MedicalClinic` (with
 * `additionalType: LocalBusiness`) because IV therapy is a regulated medical
 * service in most jurisdictions and Google's Health & Medical structured data
 * guidelines prefer the medical types when applicable.
 */
export function generateLocalBusinessSchema(input: SchemaInput): GeneratedSchema {
  const missingFields: string[] = [];
  const notes: string[] = [];

  const name = clean(input.name) || 'Your IV Therapy Clinic';
  const url = clean(input.url);
  const city = clean(input.city);
  const state = clean(input.state);
  const phone = clean(input.phone);
  const streetAddress = clean(input.streetAddress);
  const postalCode = clean(input.postalCode);
  const description = clean(input.description);
  const image = clean(input.image);
  const country = clean(input.country) || 'US';
  const services = (input.services || []).map((s) => s.trim()).filter(Boolean).slice(0, 10);

  const address: Record<string, string> = { '@type': 'PostalAddress' };
  if (streetAddress) address.streetAddress = streetAddress;
  else missingFields.push('streetAddress');
  if (city) address.addressLocality = city;
  else missingFields.push('addressLocality');
  if (state) address.addressRegion = state;
  else missingFields.push('addressRegion');
  if (postalCode) address.postalCode = postalCode;
  else missingFields.push('postalCode');
  address.addressCountry = country;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    additionalType: 'https://schema.org/LocalBusiness',
    name,
    url: url || undefined,
    address,
  };

  if (description) jsonLd.description = description;
  else missingFields.push('description');

  if (phone) jsonLd.telephone = phone;
  else missingFields.push('telephone');

  if (image) jsonLd.image = image;
  else missingFields.push('image');

  if (services.length > 0) {
    jsonLd.medicalSpecialty = ['Wellness', 'IntegrativeMedicine'];
    jsonLd.availableService = services.map((s) => ({
      '@type': 'MedicalProcedure',
      name: s,
      procedureType: 'https://schema.org/TherapeuticProcedure',
    }));
  } else {
    missingFields.push('availableService');
    notes.push("We couldn't auto-detect your services from the homepage — add an `availableService` array with each IV protocol you offer.");
  }

  if (missingFields.includes('streetAddress')) {
    notes.push("No street address detected on your homepage — patients and Google both look for this. Add your full address to the schema (and ideally to your homepage footer).");
  }
  if (missingFields.includes('telephone')) {
    notes.push("No phone number detected. Add a `tel:` link in your header and include it in the schema for click-to-call from Google.");
  }
  if (missingFields.includes('image')) {
    notes.push("No social/og image detected. Add an `og:image` meta tag and reuse the URL here so Google can show a thumbnail.");
  }

  const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;

  return { jsonLd, scriptTag, missingFields, notes };
}
