export type VisionSampleId = "receipt" | "damage" | "crash";

export type VisionSample = {
  id: VisionSampleId;
  title: string;
  blurb: string;
  input: string;
};

export const VISION_SAMPLES: VisionSample[] = [
  {
    id: "receipt",
    title: "Receipt photo",
    blurb: "Double charge on a statement. OpenAI can read the image; Jev cannot.",
    input:
      "Customer attached this statement photo and says they were charged twice for the same order.",
  },
  {
    id: "damage",
    title: "Damaged package",
    blurb: "Box arrived crushed. The photo is the evidence, not the text.",
    input:
      "The package arrived like this. Please look at the photo and decide who should handle it.",
  },
  {
    id: "crash",
    title: "Crash screenshot",
    blurb: "Checkout error screen. Mixed ticket: a short note plus the image.",
    input:
      "I can't check out. This is the screen I get when I tap pay. Please route and score urgency.",
  },
];
