import {
  DEPARTMENT_QUESTION,
  SEVERITY_QUESTION,
  URGENCY_QUESTION,
} from "../lib/templates";
import type { CanonicalCase } from "../lib/types";

const route = [DEPARTMENT_QUESTION];
const urgency = [URGENCY_QUESTION];
const severity = [SEVERITY_QUESTION];
const combined = [DEPARTMENT_QUESTION, URGENCY_QUESTION, SEVERITY_QUESTION];

export const BENCHMARK_CASES: CanonicalCase[] = [
  {
    id: "route-double-charge",
    title: "Charged twice",
    input: "I was charged twice for my order and need the extra payment refunded.",
    questions: route,
    gold: [{ questionId: "department", choice: "billing" }],
  },
  {
    id: "route-checkout-crash",
    title: "Checkout crash",
    input: "The app crashes every time I tap the checkout button. Nothing goes through.",
    questions: route,
    gold: [{ questionId: "department", choice: "technical" }],
  },
  {
    id: "route-missing-package",
    title: "Package not arrived",
    input:
      "Tracking still says in transit but the estimated delivery was four days ago and I don't have the box.",
    questions: route,
    gold: [{ questionId: "department", choice: "shipping" }],
  },
  {
    id: "route-reset-email",
    title: "Password reset email",
    input:
      "I forgot my password and the reset email never arrives. I cannot log in to my account.",
    questions: route,
    gold: [{ questionId: "department", choice: "account" }],
  },
  {
    id: "route-volume-discount",
    title: "Volume discount",
    input: "Can I get a volume discount if we buy 50 seats for our company?",
    questions: route,
    gold: [{ questionId: "department", choice: "sales" }],
  },
  {
    id: "route-wrong-vat",
    title: "Wrong VAT on invoice",
    input: "The invoice you sent shows the wrong VAT rate. Please send a corrected invoice.",
    questions: route,
    gold: [{ questionId: "department", choice: "billing" }],
  },
  {
    id: "urgent-payroll",
    title: "Payroll tomorrow",
    input:
      "Help! Our payouts have been failing for 3 days and payroll hits tomorrow morning.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: true }],
  },
  {
    id: "urgent-gift-wrap",
    title: "Gift wrapping whenever",
    input: "Whenever you have a chance, I'd like to know if you offer gift wrapping.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: false }],
  },
  {
    id: "urgent-prod-down",
    title: "Production down",
    input: "URGENT: production is down and customers cannot log in at all.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: true }],
  },
  {
    id: "urgent-no-rush",
    title: "Just browsing",
    input: "Just browsing the docs. No rush on a reply.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: false }],
  },
  {
    id: "urgent-flight",
    title: "Ten-minute deadline",
    input: "I need this answered in the next 10 minutes or I miss a flight.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: true }],
  },
  {
    id: "urgent-newsletter",
    title: "Newsletter follow-up",
    input: "Following up on last month's newsletter signup. No hurry at all.",
    questions: urgency,
    gold: [{ questionId: "urgent", boolean: false }],
  },
  {
    id: "severity-button-color",
    title: "Button color",
    input: "The submit button color feels a bit off, but everything still works.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 0 }],
  },
  {
    id: "severity-invoice-copy",
    title: "Need invoice today",
    input: "I need a copy of last month's invoice for accounting today.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 1 }],
  },
  {
    id: "severity-checkout-all",
    title: "Checkout failing for all",
    input: "Checkout is failing for all customers right now. Nobody can pay.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 3 }],
  },
  {
    id: "severity-sso-launch",
    title: "SSO blocks launch",
    input:
      "My team is blocked until SSO is fixed. We have a customer launch this afternoon.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 2 }],
  },
  {
    id: "severity-dark-mode",
    title: "Dark mode someday",
    input: "Wondering if you will add dark mode someday. Not a big deal.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 0 }],
  },
  {
    id: "severity-webhooks",
    title: "Payment webhooks failing",
    input:
      "Payment processor webhooks are erroring and orders are not being marked paid.",
    questions: severity,
    gold: [{ questionId: "severity", scoreLevel: 3 }],
  },
  {
    id: "multi-double-charge-deadline",
    title: "Refund before statement",
    input:
      "I was charged twice and nobody has replied for 3 days. I need this refunded before my card statement closes tomorrow.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "billing" },
      { questionId: "urgent", boolean: true },
      { questionId: "severity", scoreLevel: 2 },
    ],
  },
  {
    id: "multi-delivered-missing",
    title: "Delivered but missing",
    input:
      "The tracking page says delivered but I don't have the box. Not urgent, just wanted to flag it.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "shipping" },
      { questionId: "urgent", boolean: false },
      { questionId: "severity", scoreLevel: 1 },
    ],
  },
  {
    id: "multi-company-lockout",
    title: "Company lockout",
    input:
      "Cannot log in after the password reset. The entire company is locked out of the admin dashboard.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "account" },
      { questionId: "urgent", boolean: true },
      { questionId: "severity", scoreLevel: 3 },
    ],
  },
  {
    id: "multi-annual-billing",
    title: "Annual billing curiosity",
    input: "Do you offer annual billing? Just curious, no need to rush.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "sales" },
      { questionId: "urgent", boolean: false },
      { questionId: "severity", scoreLevel: 0 },
    ],
  },
  {
    id: "multi-receipts-crash",
    title: "Receipts tab crash",
    input:
      "The mobile app crashes every time I open the receipts tab. I can still use the website.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "technical" },
      { questionId: "urgent", boolean: false },
      { questionId: "severity", scoreLevel: 1 },
    ],
  },
  {
    id: "multi-site-down",
    title: "Site is down",
    input:
      "SITE IS DOWN. Customers cannot check out. This is costing us thousands per minute.",
    questions: combined,
    gold: [
      { questionId: "department", choice: "technical" },
      { questionId: "urgent", boolean: true },
      { questionId: "severity", scoreLevel: 3 },
    ],
  },
];
