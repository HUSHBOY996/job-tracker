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

  const baseURL    = process.env.ANTHROPIC_BASE_URL || "";
  const model      = process.env.AI_MODEL || "claude-haiku-4-5";
  const useDeepSeek = !!baseURL; // 有自定义 base URL 就走 OpenAI 兼容格式（DeepSeek）

  let res;
  try {
    if (useDeepSeek) {
      // ── DeepSeek / OpenAI 兼容格式 ──────────────────────────────────────
      const openaiMessages = [];
      if (body.system) openaiMessages.push({ role: "system", content: body.system });
      (body.messages || []).forEach(m => openaiMessages.push(m));

      res = await fetch(`${baseURL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${ANTHROPIC_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: body.max_tokens || 1000,
          messages:   openaiMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { statusCode: res.status, headers, body: JSON.stringify({
          error: data?.error?.message || JSON.stringify(data),
        })};
      }
      // 把 OpenAI 格式响应转换成 Anthropic 格式，前端无需改动
      const text = data.choices?.[0]?.message?.content || "";
      return { statusCode: 200, headers, body: JSON.stringify({
        content: [{ type: "text", text }],
      })};

    } else {
      // ── 原生 Anthropic 格式 ─────────────────────────────────────────────
      res = await fetch("https://api.anthropic.com/v1/messages", {
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
      if (!res.ok) {
        return { statusCode: res.status, headers, body: JSON.stringify({
          error: data?.error?.message || JSON.stringify(data),
        })};
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }
  } catch (fetchErr) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: `网络请求失败: ${fetchErr.message}` }) };
  }
};
