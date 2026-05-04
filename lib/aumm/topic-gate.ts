/**
 * Sync heuristics only for clearly abusive / disputes / scams.
 * Anything ambiguous still goes through the LLM (prompt gate + grounding).
 */

const OFF_TOPIC_DEBT_REGEX =
  /\b(devolv(e|am|a|emos|eria|eria)\s+(me(us?)?)?\s+)?(meu\s+)?(dinheiros?|fundos?|grana)\b/i;
const REFUND_TERMS_REGEX =
  /\b(reembolso|chargeback|estorno)\b|cachaceiros?|\bfraudes?\b/i;
/** Standalone provocative / abusive lines with minimal protocol context */
const POLITICAL_ATTACK_REGEX =
  /\b(lulas?\.?)\b|cachaceiros?|^l+u+l+a+[.\s,!]*$/i;

function mentionsAureumContext(text: string): boolean {
  return /\baumm\.fi\b|\baumm\b|\baureum\b|\baummt\b|\bix[A-Za-z]+\b|\bmiliarium\b|\bder\b\s+bodensee|\bbodensee\b|\bccb\b|\bccc\b\s*\(/i.test(
    text,
  );
}

/** Last user-visible text parts joined (handles multi-part messages). */
export function extractLastUserText(
  messages: { role: string; parts?: unknown[] }[],
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = m.parts as { type?: string; text?: string }[];
    if (!Array.isArray(parts)) continue;
    const text = parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("\n")
      .trim();
    if (text.length > 0) return text;
  }
  return "";
}

export type TopicGateResult =
  | { allowed: true }
  | { allowed: false; messagePt: string; messageEn: string };

/** Very short refusal the UI locale can prefer (caller picks variant). */
export function evaluateTopicGate(userTextRaw: string): TopicGateResult {
  const trimmed = userTextRaw.trim();
  if (trimmed.length < 2) return { allowed: true };

  const hasDebtAngle =
    OFF_TOPIC_DEBT_REGEX.test(trimmed) || REFUND_TERMS_REGEX.test(trimmed);
  const hasStandaloneAbusePattern = POLITICAL_ATTACK_REGEX.test(trimmed);

  if (
    (!mentionsAureumContext(trimmed) && hasDebtAngle) ||
    (!mentionsAureumContext(trimmed) && hasStandaloneAbusePattern)
  ) {
    return {
      allowed: false,
      messagePt:
        "Sou apenas o assistente de documentação do Aureum (https://aumm.fi). Não ajudo com disputas financeiras, devoluções ou fraudes — use apenas os canais oficiais indicados pelo site.",
      messageEn:
        "I'm only Aureum documentation at https://aumm.fi. I can't help with disputes, refunds, or scams — use official contacts linked from that site.",
    };
  }

  return { allowed: true };
}
