import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, type Schema } from '@google/generative-ai';
import { createAdminClient } from './supabase';

// ─── Clients (initialized lazily) ─────────────────────────
let anthropic: Anthropic | null = null;
let gemini: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return anthropic;
}

function getGemini(): GoogleGenerativeAI {
  if (!gemini) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return gemini;
}

// ─── Cost constants (June 2026 prices) ────────────────────
const COST = {
  gemini_flash_in:  0.10 / 1_000_000,  // USD per token
  gemini_flash_out: 0.40 / 1_000_000,
  gemini_pro_in:    2.00 / 1_000_000,
  gemini_pro_out:   12.0 / 1_000_000,
  claude_sonnet_in: 3.00 / 1_000_000,
  claude_sonnet_out: 15.0 / 1_000_000,
  usd_to_inr: parseFloat(process.env.USD_TO_INR || '84'),
};

// ─── Token cap check ───────────────────────────────────────
// Flat per-student daily allowance — every student gets the same allowance
// under their institution's license. No individual pricing tiers.
async function checkTokenCap(userId: string): Promise<void> {
  const cap = parseInt(process.env.STUDENT_DAILY_TOKEN_CAP || '20000');

  const db = createAdminClient();
  if (!db) return;  // local mode — no cap tracking yet
  const today = new Date().toISOString().split('T')[0];
  const { data } = await db
    .from('ai_usage_logs')
    .select('input_tokens, output_tokens')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00Z`);

  const used = (data || []).reduce((s, r) => s + r.input_tokens + r.output_tokens, 0);
  if (used >= cap) {
    throw new Error(`Daily AI limit reached (${cap.toLocaleString()} tokens). Contact your institution admin if you need a higher allowance.`);
  }
}

// ─── Log usage to DB ───────────────────────────────────────
async function logUsage(
  userId: string,
  feature: string,
  model: string,
  inTokens: number,
  outTokens: number,
): Promise<void> {
  const db = createAdminClient();
  if (!db) return;  // local mode — skip logging
  let costUSD = 0;
  if (model === 'gemini-flash') {
    costUSD = inTokens * COST.gemini_flash_in + outTokens * COST.gemini_flash_out;
  } else if (model === 'gemini-pro') {
    costUSD = inTokens * COST.gemini_pro_in + outTokens * COST.gemini_pro_out;
  } else if (model === 'claude-sonnet') {
    costUSD = inTokens * COST.claude_sonnet_in + outTokens * COST.claude_sonnet_out;
  }

  await db.from('ai_usage_logs').insert({
    user_id: userId,
    feature,
    model,
    input_tokens: inTokens,
    output_tokens: outTokens,
    cost_usd: parseFloat(costUSD.toFixed(8)),
    cost_inr: parseFloat((costUSD * COST.usd_to_inr).toFixed(6)),
  });
}

// ─── Gemini Flash (primary - 90% of calls) ────────────────
export async function callGeminiFlash(
  prompt: string,
  systemInstruction: string,
  userId: string,
  feature: string,
  jsonSchema?: Schema,
): Promise<string> {
  await checkTokenCap(userId);

  const model = getGemini().getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    // Schema-constrained output for JSON-expecting callers — Gemini enforces the
    // exact field names/types, unlike plain responseMimeType which only guarantees
    // syntactically-valid JSON (it still let stray/misspelled keys through).
    ...(jsonSchema ? { generationConfig: { responseMimeType: 'application/json', responseSchema: jsonSchema } } : {}),
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Approximate token counts
  const inTokens = Math.ceil(prompt.length / 4);
  const outTokens = Math.ceil(text.length / 4);
  await logUsage(userId, feature, 'gemini-flash', inTokens, outTokens);

  return text;
}

// ─── Gemini Pro (complex tasks - batch when possible) ─────
export async function callGeminiPro(
  prompt: string,
  systemInstruction: string,
  userId: string,
  feature: string,
): Promise<string> {
  await checkTokenCap(userId);

  const model = getGemini().getGenerativeModel({
    model: 'gemini-flash-latest',   // upgrade to pro when available
    systemInstruction,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const inTokens = Math.ceil(prompt.length / 4);
  const outTokens = Math.ceil(text.length / 4);
  await logUsage(userId, feature, 'gemini-pro', inTokens, outTokens);

  return text;
}

// ─── Gemini Vision (Vault Mode proctoring snapshots) ──────
export async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  userId: string,
  feature: string,
): Promise<string> {
  await checkTokenCap(userId);

  const model = getGemini().getGenerativeModel({ model: 'gemini-flash-latest' });
  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    prompt,
  ]);
  const text = result.response.text();

  // Vision calls cost more than text-only — log under the pro tier for accurate cost tracking.
  await logUsage(userId, feature, 'gemini-pro', 500, Math.ceil(text.length / 4));

  return text;
}

// ─── Claude Sonnet (Socratic tutor - most nuanced) ────────
export async function callClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  system: string,
  userId: string,
  feature: string,
  maxTokens = 800,
): Promise<string> {
  await checkTokenCap(userId);

  const client = getAnthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system,
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const inTokens = response.usage.input_tokens;
  const outTokens = response.usage.output_tokens;
  await logUsage(userId, feature, 'claude-sonnet', inTokens, outTokens);

  return text;
}

// ─── JSON extraction helper ────────────────────────────────
export function extractJSON<T>(text: string): T | null {
  // Object pattern first: for a response shaped {"key": [...]}, the array
  // pattern would greedily match just the inner array and return early,
  // dropping the wrapping object entirely. Bare top-level arrays (no
  // enclosing object) still work via the array pattern — the object
  // pattern fails to parse an unwrapped sequence of objects and falls
  // through, since the regex leaves out the enclosing [ ].
  const patterns = [/\{[\s\S]*\}/, /\[[\s\S]*\]/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch {}
    }
  }
  return null;
}

// ─── Streaming helper (Claude) ─────────────────────────────
export async function* streamClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  system: string,
): AsyncGenerator<string> {
  const client = getAnthropic();
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

// ─── WhatsApp helper ───────────────────────────────────────
export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
