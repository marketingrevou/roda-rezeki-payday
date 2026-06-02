export interface Segment {
  label: string;
  probability: number;
  color: string;
  textColor: string;
}

export const SEGMENTS: Segment[] = [
  {
    label: "BNSP + AI Free Learning + Starter Kit",
    probability: 50,
    color: "#4b78f0",
    textColor: "#ffffff",
  },
  {
    label: "BNSP + Starter Kit",
    probability: 25,
    color: "#1e2d8a",
    textColor: "#ffffff",
  },
  {
    label: "BNSP + AI Free Learning",
    probability: 25,
    color: "#2d45c0",
    textColor: "#ffffff",
  },
  {
    label: "Diskon 50%",
    probability: 0,
    color: "#1a2578",
    textColor: "#ffffff",
  },
  {
    label: "BNSP",
    probability: 0,
    color: "#3050d8",
    textColor: "#ffffff",
  },
];

export const SWE_SEGMENTS: Segment[] = [
  {
    label: "Jaminan Refund 3 juta",
    probability: 40,
    color: "#263bc0",
    textColor: "#ffffff",
  },
  {
    label: "Jaminan Refund 3 juta + AI video learning",
    probability: 40,
    color: "#3a56d8",
    textColor: "#ffffff",
  },
  {
    label: "Jaminan Refund 3.5 juta",
    probability: 10,
    color: "#1e2d8a",
    textColor: "#ffffff",
  },
  {
    label: "Jaminan Refund 3.5 juta + AI video learning",
    probability: 10,
    color: "#2d45c0",
    textColor: "#ffffff",
  },
  {
    label: "Jaminan Refund 4 juta",
    probability: 0,
    color: "#1a2578",
    textColor: "#ffffff",
  },
];

function pickFromSegments(segments: Segment[]): { label: string; segmentIndex: number } {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < segments.length; i++) {
    cumulative += segments[i].probability;
    if (rand < cumulative) {
      return { label: segments[i].label, segmentIndex: i };
    }
  }
  return {
    label: segments[segments.length - 1].label,
    segmentIndex: segments.length - 1,
  };
}

export function pickResult(): { label: string; segmentIndex: number } {
  return pickFromSegments(SEGMENTS);
}

export function pickResultForVariant(variant?: string): { label: string; segmentIndex: number } {
  if (variant === "swe") return pickFromSegments(SWE_SEGMENTS);
  return pickFromSegments(SEGMENTS);
}
