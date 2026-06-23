import jsPDF from 'jspdf';
import type { PredictResponse } from '../services/predictionsService';
import { BRFSS_FIELDS, MODEL_LABELS } from '../config/brfssFeatures';

const PAGE_HEIGHT_MM = 297;
const PAGE_WIDTH_MM = 210;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH_MM - MARGIN * 2;
const LINE_HEIGHT = 5;
const SMALL_LINE = 4;

const BG: [number, number, number] = [18, 18, 20];
const ACCENT: [number, number, number] = [37, 99, 235]; // brand blue
const GREEN: [number, number, number] = [52, 211, 153];
const AMBER: [number, number, number] = [251, 191, 36];
const RED: [number, number, number] = [248, 113, 113];

export type ReportData = {
  paramCount: number;
  totalParams: number;
  enteredFeatures: string[];
  features: Record<string, number>;
  selectedModelIds: string[];
  results: PredictResponse[];
  generatedAt: Date;
  userLabel?: string;
};

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  BRFSS_FIELDS.map((f) => [f.name, f.label]),
);

function fmtFeatureValue(name: string, value: number): string {
  const field = BRFSS_FIELDS.find((f) => f.name === name);
  if (field?.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  if (field?.type === 'binary') return value === 1 ? 'Yes' : 'No';
  return String(value);
}

function riskColor(p: number): [number, number, number] {
  if (p >= 0.5) return RED;
  if (p >= 0.3) return AMBER;
  return GREEN;
}

function ensureSpace(pdf: jsPDF, yPos: number, needed: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (yPos + needed > pageHeight - MARGIN) {
    pdf.addPage();
    pdf.setFillColor(BG[0], BG[1], BG[2]);
    pdf.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');
    return MARGIN;
  }
  return yPos;
}

function drawWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
): number {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text || '—', maxWidth);
  lines.forEach((line: string) => {
    pdf.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function sectionHeading(pdf: jsPDF, label: string, y: number): number {
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(label, MARGIN, y);
  pdf.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y + 2, MARGIN + 40, y + 2);
  return y + 9;
}

function drawProbabilityChart(
  pdf: jsPDF,
  rows: Array<{ label: string; probability: number }>,
  startX: number,
  startY: number,
  chartWidth: number,
): number {
  const labelWidth = 46;
  const barHeight = 6;
  const gap = 4;
  const barMaxWidth = chartWidth - labelWidth - 16;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(160, 160, 160);
  pdf.text('0%', startX + labelWidth - 1, startY + 2);
  pdf.text('100%', startX + labelWidth + barMaxWidth - 6, startY + 2);
  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.2);
  pdf.line(startX + labelWidth, startY + 3, startX + labelWidth + barMaxWidth, startY + 3);

  let y = startY + 7;
  rows.forEach((r) => {
    const lines = pdf.splitTextToSize(r.label, labelWidth - 2);
    pdf.setFontSize(7.5);
    pdf.setTextColor(220, 220, 220);
    lines.slice(0, 2).forEach((line: string, i: number) => {
      pdf.text(line, startX, y + 3 + i * 3.2);
    });
    const score = Math.max(0, Math.min(1, r.probability));
    const barLen = barMaxWidth * score;
    const c = riskColor(score);
    pdf.setFillColor(c[0], c[1], c[2]);
    pdf.rect(startX + labelWidth, y, barLen, barHeight, 'F');
    pdf.setFillColor(40, 40, 40);
    pdf.rect(startX + labelWidth + barLen, y, barMaxWidth - barLen, barHeight, 'F');
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.setFontSize(7);
    pdf.text(`${(score * 100).toFixed(1)}%`, startX + labelWidth + barMaxWidth + 2, y + barHeight / 2 + 1.5);
    y += Math.max(barHeight + gap, lines.slice(0, 2).length * 3.2 + 3);
  });
  return y;
}

export function generatePredictionReport(data: ReportData): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = MARGIN;

  pdf.setFillColor(BG[0], BG[1], BG[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const title = 'AI Cardiologist — Prediction Report';
  pdf.text(title, (pageWidth - pdf.getTextWidth(title)) / 2, yPos + 2);
  yPos += 9;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(160, 160, 160);
  const meta = `Generated ${data.generatedAt.toLocaleString()}${data.userLabel ? ` · ${data.userLabel}` : ''}`;
  pdf.text(meta, (pageWidth - pdf.getTextWidth(meta)) / 2, yPos);
  yPos += 10;

  // Champion banner (highest risk model)
  const ranked = [...data.results].sort((a, b) => b.probability - a.probability);
  const champion = ranked[0];
  if (champion) {
    const c = riskColor(champion.probability);
    pdf.setFillColor(30, 30, 34);
    pdf.setDrawColor(c[0], c[1], c[2]);
    pdf.setLineWidth(0.4);
    try {
      (pdf as unknown as { roundedRect: (...a: number[]) => void }).roundedRect(
        MARGIN, yPos, CONTENT_WIDTH, 24, 2, 2, 'FD' as unknown as number,
      );
    } catch {
      pdf.rect(MARGIN, yPos, CONTENT_WIDTH, 24, 'FD');
    }
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.text(
      `Highest-risk model: ${MODEL_LABELS[champion.modelId] ?? champion.modelId}`,
      MARGIN + 6, yPos + 8,
    );
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 220, 220);
    pdf.text(`P(CVD) = ${(champion.probability * 100).toFixed(1)}%`, MARGIN + 6, yPos + 15);
    pdf.text(
      `Classification: ${champion.prediction === 1 ? 'Elevated risk' : 'Lower risk'} (${champion.riskLabel})`,
      MARGIN + 6, yPos + 21,
    );
    yPos += 32;
  }

  // ---------- Settings ----------
  yPos = sectionHeading(pdf, 'Configuration', yPos);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(212, 212, 216);
  yPos = drawWrappedText(
    pdf,
    `Parameters used: ${data.paramCount} of ${data.totalParams} (top significant predictors).`,
    MARGIN, yPos, CONTENT_WIDTH, 10, LINE_HEIGHT,
  );
  const modelNames = data.selectedModelIds.map((m) => MODEL_LABELS[m] ?? m).join(', ');
  yPos = drawWrappedText(pdf, `Models evaluated: ${modelNames}`, MARGIN, yPos, CONTENT_WIDTH, 10, LINE_HEIGHT);
  yPos += 4;

  // Entered parameters table
  yPos = ensureSpace(pdf, yPos, 20);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(200, 200, 200);
  pdf.text('Entered parameters', MARGIN, yPos);
  yPos += 6;

  const colW = CONTENT_WIDTH / 2;
  const entered = data.enteredFeatures.length ? data.enteredFeatures : Object.keys(data.features);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  let col = 0;
  let rowY = yPos;
  entered.forEach((name) => {
    const x = MARGIN + col * colW;
    pdf.setTextColor(150, 150, 150);
    const label = FIELD_LABELS[name] ?? name;
    pdf.text(`${label}:`, x, rowY);
    pdf.setTextColor(230, 230, 230);
    pdf.text(fmtFeatureValue(name, data.features[name]), x + colW - 28, rowY);
    col += 1;
    if (col === 2) {
      col = 0;
      rowY += 5.5;
      rowY = ensureSpace(pdf, rowY, 8);
    }
  });
  yPos = (col === 0 ? rowY : rowY + 5.5) + 6;

  // ---------- Predictions table ----------
  yPos = ensureSpace(pdf, yPos, 40);
  yPos = sectionHeading(pdf, 'Model Predictions', yPos);

  const headers = ['Model', 'P(CVD)', 'Classification', 'Risk'];
  const widths = [70, 28, 50, 32];
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  let hx = MARGIN;
  headers.forEach((h, i) => {
    pdf.setFillColor(30, 30, 34);
    pdf.rect(hx, yPos, widths[i], 8, 'F');
    pdf.setTextColor(200, 200, 200);
    pdf.text(h, hx + 2, yPos + 5.5);
    hx += widths[i];
  });
  yPos += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  ranked.forEach((r) => {
    yPos = ensureSpace(pdf, yPos, 9);
    pdf.setFillColor(24, 24, 27);
    pdf.rect(MARGIN, yPos, CONTENT_WIDTH, 7, 'F');
    const c = riskColor(r.probability);
    let cx = MARGIN;
    pdf.setTextColor(255, 255, 255);
    pdf.text(MODEL_LABELS[r.modelId] ?? r.modelId, cx + 2, yPos + 5);
    cx += widths[0];
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.text(`${(r.probability * 100).toFixed(1)}%`, cx + 2, yPos + 5);
    cx += widths[1];
    pdf.setTextColor(230, 230, 230);
    pdf.text(r.prediction === 1 ? 'Elevated risk' : 'Lower risk', cx + 2, yPos + 5);
    cx += widths[2];
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.text(r.riskLabel, cx + 2, yPos + 5);
    yPos += 7;
  });
  yPos += 10;

  // ---------- Probability chart ----------
  yPos = ensureSpace(pdf, yPos, ranked.length * 11 + 24);
  yPos = sectionHeading(pdf, 'Risk Probability by Model', yPos);
  yPos = drawProbabilityChart(
    pdf,
    ranked.map((r) => ({ label: MODEL_LABELS[r.modelId] ?? r.modelId, probability: r.probability })),
    MARGIN, yPos, CONTENT_WIDTH,
  );
  yPos += 10;

  // ---------- Top contributors (champion) ----------
  if (champion?.explanation?.topContributions?.length) {
    yPos = ensureSpace(pdf, yPos, 40);
    yPos = sectionHeading(
      pdf,
      `Top Contributors — ${MODEL_LABELS[champion.modelId] ?? champion.modelId}`,
      yPos,
    );
    const contributions = champion.explanation.topContributions.slice(0, 8);
    const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 1e-6);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    contributions.forEach((item) => {
      yPos = ensureSpace(pdf, yPos, 8);
      pdf.setTextColor(200, 200, 200);
      const label = FIELD_LABELS[item.feature] ?? item.feature;
      pdf.text(label, MARGIN, yPos + 3);
      const barStart = MARGIN + 55;
      const barMax = CONTENT_WIDTH - 75;
      const frac = Math.abs(item.contribution) / maxAbs;
      const positive = item.contribution >= 0;
      const c = positive ? RED : GREEN;
      pdf.setFillColor(c[0], c[1], c[2]);
      pdf.rect(barStart, yPos, barMax * frac, 4, 'F');
      pdf.setTextColor(c[0], c[1], c[2]);
      pdf.setFontSize(8);
      pdf.text(
        `${item.contribution >= 0 ? '+' : ''}${item.contribution.toFixed(3)}`,
        barStart + barMax + 2, yPos + 3,
      );
      pdf.setFontSize(9);
      yPos += 6.5;
    });
    yPos += 6;
  }

  // ---------- Disclaimer ----------
  yPos = ensureSpace(pdf, yPos, 40);
  yPos = sectionHeading(pdf, 'Clinical Disclaimer', yPos);
  pdf.setFillColor(40, 30, 20);
  pdf.setDrawColor(120, 90, 40);
  pdf.setLineWidth(0.3);
  const disclaimer =
    'This report is generated by AI Cardiologist for research and decision-support purposes only. ' +
    'It does NOT constitute a medical diagnosis, professional medical advice, or a substitute for ' +
    'consultation with a qualified clinician. Predictions are probabilistic estimates from machine-learning ' +
    'models trained on population-level BRFSS survey data and may not reflect an individual\'s true risk. ' +
    'When fewer than the full parameter set is provided, omitted predictors are imputed with population-neutral ' +
    'baseline values, which can affect results. Always seek the advice of a physician or other qualified health ' +
    'provider with any questions regarding a medical condition.';
  const dLines = pdf.splitTextToSize(disclaimer, CONTENT_WIDTH - 12);
  const boxH = 8 + dLines.length * SMALL_LINE + 6;
  try {
    (pdf as unknown as { roundedRect: (...a: number[]) => void }).roundedRect(
      MARGIN, yPos, CONTENT_WIDTH, boxH, 2, 2, 'FD' as unknown as number,
    );
  } catch {
    pdf.rect(MARGIN, yPos, CONTENT_WIDTH, boxH, 'FD');
  }
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(214, 188, 140);
  let dy = yPos + 8;
  dLines.forEach((line: string) => {
    pdf.text(line, MARGIN + 6, dy);
    dy += SMALL_LINE;
  });

  // ---------- Footer ----------
  const totalPages = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 150, 150);
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footer = `AI Cardiologist · Page ${i} of ${totalPages}`;
    pdf.text(footer, (pageWidth - pdf.getTextWidth(footer)) / 2, pageHeight - 8);
  }

  const filename = `ai-cardiologist-report-${data.generatedAt.toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}
