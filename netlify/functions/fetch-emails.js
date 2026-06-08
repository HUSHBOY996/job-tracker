// netlify/functions/fetch-emails.js
// Netlify Serverless Function
// 职责：IMAP 拉取邮件 + 服务端调用 Claude API 解析
// 前端只需一次请求，拿到已解析好的结构化申请列表
// 环境变量：ANTHROPIC_API_KEY（在 Netlify Dashboard > Environment variables 配置）

import { ImapFlow } from "imapflow";

// ── 预过滤：只排除明显的垃圾/系统邮件，其余全部交给 Claude 判断 ──────────────
// 不在此处做求职判断，避免漏掉"一面通知""校招""JD YOUNG"等非标准表达
const EXCLUDE_KEYWORDS = [
  "验证码", "verification code", "password reset", "密码重置",
  "unsubscribe", "退订", "newsletter", "广告", "促销",
  "transaction", "receipt", "invoice", "订单", "快递",
  "银行", "还款", "账单", "水电", "物业",
];

function isJobRelated(subject = "", snippet = "") {
  const text = (subject + " " + snippet).toLowerCase();
  const isExcluded = EXCLUDE_KEYWORDS.some(k => text.includes(k.toLowerCase()));
  return !isExcluded;
}

const JOB_KEYWORDS = [
  "面试", "笔试", "一面", "二面", "三面", "终面", "hr面", "hr interview",
  "offer", "录用", "入职", "实习", "校招", "社招", "招聘", "求职", "应聘",
  "测评", "assessment", "interview", "jd young", "面邀",
  "岗位", "职位", "校园招聘", "春招", "秋招",
];

function hasJobKeywords(subject = "", snippet = "") {
  const text = (subject + " " + snippet).toLowerCase();
  return JOB_KEYWORDS.some(k => text.includes(k));
}

// ── 方案D：IMAP 正文解码（base64 / quoted-printable）────────────────────────
function decodeQP(buf) {
  return buf.toString("binary")
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function decodeMailBody(buf, encoding = "") {
  const enc = encoding.toLowerCase().trim();
  if (enc === "base64") {
    return Buffer.from(buf.toString("ascii").replace(/\s/g, ""), "base64").toString("utf8");
  }
  if (enc === "quoted-printable") {
    return Buffer.from(decodeQP(buf), "binary").toString("utf8");
  }
  return buf.toString("utf8");
}

// ── 方案A：从邮件主题中提取公司名（兜底）────────────────────────────────────
function extractCompanyFromSubject(subject = "") {
  const m = subject.match(/【(.+?)】|「(.+?)」|\[(.+?)\]/);
  if (!m) return "";
  const raw = (m[1] || m[2] || m[3] || "").trim();
  // 去掉"校招""招聘""通知"等后缀词，保留公司主体
  return raw.replace(/校招|招聘|通知|官方|campus/gi, "").trim() || raw;
}

// ── IMAP 服务器配置 ────────────────────────────────────────────────────────
const IMAP_HOSTS = {
  "qq.com":      { host: "imap.qq.com",           port: 993 },
  "foxmail.com": { host: "imap.qq.com",           port: 993 },
  "163.com":     { host: "imap.163.com",          port: 993 },
  "126.com":     { host: "imap.126.com",          port: 993 },
  "yeah.net":    { host: "imap.yeah.net",         port: 993 },
  "gmail.com":   { host: "imap.gmail.com",        port: 993 },
  "outlook.com": { host: "outlook.office365.com", port: 993 },
  "hotmail.com": { host: "outlook.office365.com", port: 993 },
};

// ── 服务端调用 Claude API 解析单封邮件 ────────────────────────────────────
async function parseWithClaude(fullText, apiKey, hintJobRelated = false) {
  // 支持自定义 base URL（兼容 DeepSeek 等兼容 Anthropic 格式的接口）
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const model   = process.env.AI_MODEL || "claude-sonnet-4-20250514";
  const res = await fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system: `你是求职邮件解析助手。只返回 JSON，不输出任何其他文字。
判断标准（宽松识别，宁可误判不可漏判）：
- isJobRelated = true 的情况：面试、笔试、一面、二面、三面、终面、HR面、offer、录用、
  入职、实习、校招、社招、招聘、求职、应聘、测评、assessment、interview、
  "通知"+"职位/岗位/实习/校招"组合、任何公司发来的职位相关邮件
- isJobRelated = false 的情况：纯验证码、密码重置、快递、账单、广告促销、系统通知
格式：{
  "isJobRelated": true或false,
  "company": "公司名（从发件人或正文提取，没有则填发件方域名）",
  "position": "职位名（没有则填'待确认'）",
  "emailType": "面试邀请|笔试通知|一面通知|二面通知|HR面通知|offer|拒信|进度通知|其他",
  "status": "面试中|笔试中|已offer|已拒绝|已投递",
  "interviewTime": "面试时间（如有，格式尽量标准化）或null",
  "location": "工作地点或null",
  "salary": "薪资或null",
  "confidence": 0到1的数字,
  "summary": "一句话概括邮件核心内容"
}`,
      messages: [{ role: "user", content: hintJobRelated
        ? `【重要提示：此邮件主题或内容包含明确的求职/招聘关键词，isJobRelated 必须返回 true】\n\n邮件内容：\n\n${fullText}`
        : `邮件内容：\n\n${fullText}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data.content?.[0]?.text || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ── 主 Handler ─────────────────────────────────────────────────────────────
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

  // 读取 Anthropic API Key（从 Netlify 环境变量注入）
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({
        error: "服务端未配置 ANTHROPIC_API_KEY，请在 Netlify Dashboard → Environment variables 中添加",
      }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { email, authCode, days = 30, limit = 50 } = body;
  if (!email || !authCode)
    return { statusCode: 400, headers, body: JSON.stringify({ error: "缺少邮箱地址或授权码" }) };

  const domain  = email.split("@")[1]?.toLowerCase();
  const imapCfg = IMAP_HOSTS[domain];
  if (!imapCfg)
    return { statusCode: 400, headers, body: JSON.stringify({ error: `暂不支持 ${domain} 邮箱` }) };

  // ── Step 1: IMAP 拉取 ──────────────────────────────────────────────────
  const client = new ImapFlow({
    host: imapCfg.host, port: imapCfg.port, secure: true,
    auth: { user: email, pass: authCode },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout:   10000,
  });

  let rawEmails = [];
  let totalCount = 0;

  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });

    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const uids = await client.search({ since, not: { deleted: true } }, { uid: true });
    totalCount = uids?.length || 0;

    if (totalCount > 0) {
      const targetUids = uids.slice(-Number(limit));
      for await (const msg of client.fetch(targetUids, {
        uid: true, envelope: true, bodyStructure: true, bodyParts: ["TEXT"],
      }, { uid: true })) {
        try {
          const subject  = msg.envelope?.subject || "(无主题)";
          const from     = msg.envelope?.from?.[0];
          const fromAddr = from ? `${from.name || ""} <${from.address}>`.trim() : "未知发件人";
          const date     = msg.envelope?.date?.toISOString() || new Date().toISOString();
          const rawBuf   = msg.bodyParts?.get("text") || Buffer.alloc(0);
          const encoding = msg.bodyStructure?.encoding || "";
          const bodyText = decodeMailBody(rawBuf, encoding);
          const snippet  = bodyText.slice(0, 500);

          // 不做硬过滤，全部交给 Claude + 用户自行决定
          // 只跳过极明显的系统邮件（主题仅含纯数字验证码）
          if (/^\d{4,8}$/.test(subject.trim())) continue;

          rawEmails.push({
            uid:            String(msg.uid),
            subject,
            hintJobRelated: hasJobKeywords(subject, ""),
            fullText: `发件人：${fromAddr}\n【邮件主题】${subject}\n日期：${date}\n\n${bodyText.slice(0, 3000)}`,
          });
        } catch (_) {}
      }
    }

    await client.logout();
  } catch (err) {
    try { await client.logout(); } catch (_) {}
    const msg = err.message || String(err);
    if (msg.includes("auth") || msg.includes("LOGIN") || msg.includes("credentials"))
      return { statusCode: 401, headers, body: JSON.stringify({ error: "授权码错误或已过期" }) };
    if (msg.includes("ETIMEDOUT") || msg.includes("timeout"))
      return { statusCode: 503, headers, body: JSON.stringify({ error: "连接邮件服务器超时" }) };
    return { statusCode: 500, headers, body: JSON.stringify({ error: `IMAP 错误：${msg}` }) };
  }

  if (rawEmails.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({
      parsed: [], total: totalCount, fetched: 0,
    })};
  }

  // ── Step 2: 服务端逐封调用 Claude 解析 ───────────────────────────────────
  const parsed    = [];
  const parseLog  = [];   // 每封解析结果摘要，方便前端展示

  for (const em of rawEmails) {
    try {
      let result;

      if (em.hintJobRelated) {
        // 含求职关键词 → 调 Claude 精确解析
        result = await parseWithClaude(em.fullText, ANTHROPIC_API_KEY, true);
        if (!result.isJobRelated) {
          result.isJobRelated = true;
          result.confidence = Math.max(result.confidence ?? 0, 0.6);
        }
        if (!result.company) {
          result.company = extractCompanyFromSubject(em.subject) || "待确认";
        }
      } else {
        // 不含求职关键词 → 跳过 Claude，直接返回"待用户确认"占位
        result = {
          isJobRelated:  false,
          company:       extractCompanyFromSubject(em.subject) || "待确认",
          position:      "待确认",
          emailType:     "其他",
          status:        "已投递",
          interviewTime: null,
          location:      null,
          salary:        null,
          confidence:    0.2,
          summary:       "非求职关键词邮件，请手动确认",
        };
      }

      parseLog.push({
        uid:          em.uid,
        subject:      em.subject,
        isJobRelated: result.isJobRelated,
        company:      result.company,
        position:     result.position,
        emailType:    result.emailType,
        confidence:   result.confidence,
        summary:      result.summary,
      });
      parsed.push({ ...result, uid: em.uid, subject: em.subject });
    } catch (e) {
      parseLog.push({ uid: em.uid, subject: em.subject, error: e.message });
    }
  }

  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      parsed,                        // 有效申请列表（前端直接用）
      parseLog,                      // 每封邮件的解析摘要（前端展示调试信息）
      total:   totalCount,
      fetched: rawEmails.length,
    }),
  };
};
