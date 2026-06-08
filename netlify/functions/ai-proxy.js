// netlify/functions/ai-proxy.js
// 前端所有 AI 请求统一走此代理，避免在浏览器暴露 API Key

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY)
    return { statusCode: 500, headers, body: JSON.stringify({ error: "未配置 ANTHROPIC_API_KEY" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const model   = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

  const res = await fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: body.max_tokens || 1000,
      system:     body.system,
      messages:   body.messages,
    }),
  });

  const data = await res.json();
  return { statusCode: res.status, headers, body: JSON.stringify(data) };
};
