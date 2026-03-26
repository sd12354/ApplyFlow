export type ClassifiedStatus = "APPLIED" | "INTERVIEW" | "REJECTED" | "OFFER";

const APPLIED_PATTERNS = [
  /application received/i,
  /thank you for applying/i,
  /received your application/i,
  /your application has been received/i,
];

const INTERVIEW_PATTERNS = [
  /interview/i,
  /interview invitation/i,
  /schedule (an )?interview/i,
  /next round/i,
];

const REJECTED_PATTERNS = [
  /we regret to inform you/i,
  /not moving forward/i,
  /unfortunately/i,
  /decided to move forward with other candidates/i,
];

const OFFER_PATTERNS = [
  /job offer/i,
  /offer letter/i,
  /pleased to offer you/i,
  /we are excited to offer you/i,
  /congratulations.*offer/i,
];

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function filterEmailByKeywords(text: string): boolean {
  return (
    matchesAny(text, APPLIED_PATTERNS) ||
    matchesAny(text, INTERVIEW_PATTERNS) ||
    matchesAny(text, REJECTED_PATTERNS) ||
    matchesAny(text, OFFER_PATTERNS)
  );
}

export function classifyEmail(text: string): ClassifiedStatus | null {
  // Order matters: some keywords may overlap; we prefer the most decisive status.
  if (matchesAny(text, REJECTED_PATTERNS)) return "REJECTED";
  if (matchesAny(text, OFFER_PATTERNS)) return "OFFER";
  if (matchesAny(text, INTERVIEW_PATTERNS)) return "INTERVIEW";
  if (matchesAny(text, APPLIED_PATTERNS)) return "APPLIED";

  return null;
}

