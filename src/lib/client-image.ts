import type { VisionSampleId } from "@/data/vision-samples";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

function canvasToJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function fileToImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not read that image.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToJpeg(canvas);
}

export function renderVisionSample(id: VisionSampleId): string {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not draw the sample image.");
  }
  if (id === "receipt") {
    drawReceipt(context, canvas.width, canvas.height);
  } else if (id === "damage") {
    drawDamage(context, canvas.width, canvas.height);
  } else {
    drawCrash(context, canvas.width, canvas.height);
  }
  return canvasToJpeg(canvas);
}

function fill(context: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
}

function line(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = "600",
) {
  context.fillStyle = color;
  context.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
  context.fillText(text, x, y);
}

function drawReceipt(context: CanvasRenderingContext2D, width: number, height: number) {
  fill(context, "#111318", 0, 0, width, height);
  fill(context, "#f4efe4", 90, 40, width - 180, height - 80);
  line(context, "NORTHWIND STORE", 140, 110, 28, "#1a1a1a");
  line(context, "Order #48219", 140, 150, 18, "#555", "500");
  line(context, "WIDGET PRO", 140, 230, 20, "#1a1a1a", "500");
  line(context, "$48.00", 480, 230, 20, "#1a1a1a");
  line(context, "WIDGET PRO", 140, 280, 20, "#1a1a1a", "500");
  line(context, "$48.00", 480, 280, 20, "#b42318");
  line(context, "DUPLICATE CHARGE", 140, 330, 18, "#b42318");
  line(context, "Card  ···· 4412", 140, 420, 16, "#555", "500");
  line(context, "TOTAL  $96.00", 140, 480, 24, "#1a1a1a");
}

function drawDamage(context: CanvasRenderingContext2D, width: number, height: number) {
  fill(context, "#1c1712", 0, 0, width, height);
  fill(context, "#c4a574", 160, 180, 400, 280);
  fill(context, "#8a6a3b", 160, 180, 400, 36);
  context.strokeStyle = "#5c3b1e";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(220, 220);
  context.lineTo(480, 430);
  context.stroke();
  context.beginPath();
  context.moveTo(500, 230);
  context.lineTo(240, 420);
  context.stroke();
  line(context, "THIS SIDE UP", 250, 500, 22, "#ead9b8");
  line(context, "Box crushed on arrival", 180, 620, 22, "#f3e6d0", "500");
}

function drawCrash(context: CanvasRenderingContext2D, width: number, height: number) {
  fill(context, "#0b0d12", 0, 0, width, height);
  fill(context, "#161b26", 60, 80, width - 120, height - 160);
  fill(context, "#ff6b7a", 60, 80, width - 120, 8);
  line(context, "Checkout", 100, 160, 18, "#8b93a7", "500");
  line(context, "Payment failed", 100, 230, 36, "#eef2f8");
  line(context, "ERR_CHECKOUT_TIMEOUT", 100, 280, 16, "#ff6b7a", "500");
  fill(context, "#2a3142", 100, 340, width - 200, 56);
  line(context, "Pay $48.00", 120, 376, 20, "#eef2f8", "500");
  line(context, "Try again", 100, 460, 16, "#8b93a7", "500");
}
