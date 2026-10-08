import type { CanonicalQuestion } from "./types";

export const DEPARTMENT_QUESTION: CanonicalQuestion = {
  id: "department",
  type: "choice",
  instructions:
    "Which department should handle this message? Pick the single best owner.",
  options: [
    {
      value: "billing",
      description: "Payments, invoices, refunds, charges, VAT, statements",
    },
    {
      value: "technical",
      description: "Bugs, crashes, outages, product not working",
    },
    {
      value: "shipping",
      description: "Delivery, tracking, lost or damaged packages",
    },
    {
      value: "account",
      description: "Login, password, email, profile, access lockouts",
    },
    {
      value: "sales",
      description: "Pricing, upgrades, new accounts, discounts, plan questions",
    },
  ],
};

export const URGENCY_QUESTION: CanonicalQuestion = {
  id: "urgent",
  type: "boolean",
  instructions:
    "Does this message express time-sensitive urgency that needs a response now? Treat explicit deadlines, outages, emergencies, and phrases like urgent as yes. Treat no rush, whenever, just curious, and informational follow-ups as no.",
};

export const SEVERITY_QUESTION: CanonicalQuestion = {
  id: "severity",
  type: "score",
  instructions: "How severe is the operational impact of this message?",
  levels: [
    {
      label: "routine",
      description: "Cosmetic or informational; the product fully works",
    },
    {
      label: "today",
      description: "Needs handling today; a workaround exists or impact is limited",
    },
    {
      label: "urgent",
      description: "A team or customer is blocked against a short deadline",
    },
    {
      label: "critical",
      description: "Outage, data loss, or widespread failure happening now",
    },
  ],
};

export const TEMPLATES = {
  route: {
    id: "route",
    label: "Route the ticket",
    questions: [DEPARTMENT_QUESTION],
  },
  urgency: {
    id: "urgency",
    label: "Is it urgent?",
    questions: [URGENCY_QUESTION],
  },
  severity: {
    id: "severity",
    label: "Score severity",
    questions: [SEVERITY_QUESTION],
  },
  combined: {
    id: "combined",
    label: "Route + urgency + severity",
    questions: [DEPARTMENT_QUESTION, URGENCY_QUESTION, SEVERITY_QUESTION],
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;
