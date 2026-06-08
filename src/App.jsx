import { useState, useEffect, useRef } from "react";

// ─── localStorage 持久化 ───────────────────────────────────────────────────────
const db = {
  get: async (k)    => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : null; } catch { return null; } },
  set: async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn("storage set failed", k, e); } },
  del: async (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block", ...style }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const icons = {
  dashboard:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  briefcase:    ["M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z","M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"],
  check:        "M9 11l3 3L22 4",
  checkCircle:  ["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4 12 14.01l-3-3"],
  circle:       "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  bot:          ["M12 8V4","M8 4h8","rect x='3' y='8' width='18' height='12' rx='2'","M10 16s0-2 2-2 2 2 2 2","M8 13v0","M16 13v0"],
  user:         ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  plus:         ["M12 5v14","M5 12h14"],
  search:       ["M11 3a8 8 0 1 0 0 16A8 8 0 0 0 11 3z","M21 21l-4.35-4.35"],
  x:            ["M18 6 6 18","M6 6l12 12"],
  arrowLeft:    ["M19 12H5","M12 19l-7-7 7-7"],
  clock:        ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M12 6v6l4 2"],
  trash:        ["M3 6h18","M8 6V4h8v2","M19 6l-1 14H6L5 6"],
  chevronRight: "M9 18l6-6-6-6",
  chevronLeft:  "M15 18l-6-6 6-6",
  send:         ["M22 2 11 13","M22 2 15 22 11 13 2 9l20-7z"],
  fileText:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  bell:         ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  settings:     ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  mapPin:       ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  dollarSign:   ["M12 1v22","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  mail:         ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"],
  refresh:      ["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  checkSquare:  ["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
  edit:         ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  alertCircle:  ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M12 8v4","M12 16h.01"],
};
const CalIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ─── Default data ──────────────────────────────────────────────────────────────
const defaultApps = [
  { id:1, company:"腾讯", position:"产品经理实习生", status:"面试中", location:"深圳", salary:"200-250/天", progress:60, updateTime:"2小时前", logo:"腾", tags:["互联网","大厂"] },
  { id:2, company:"字节跳动", position:"产品运营", status:"笔试中", location:"北京", salary:"300-400/天", progress:40, updateTime:"昨天", logo:"字", tags:["内容","运营"] },
  { id:3, company:"阿里巴巴", position:"产品经理", status:"HR面", location:"杭州", salary:"400-500/天", progress:80, updateTime:"3天前", logo:"阿", tags:["电商","B端"] },
  { id:4, company:"美团", position:"商业分析", status:"已投递", location:"北京", salary:"250-300/天", progress:20, updateTime:"1周前", logo:"美", tags:["本地生活","数据"] },
  { id:5, company:"京东", position:"供应链产品", status:"已offer", location:"北京", salary:"350-450/天", progress:100, updateTime:"2周前", logo:"京", tags:["物流","供应链"] },
];
const defaultTodos = [
  { id:1, title:"准备腾讯产品经理面试", deadline:"今天 14:00", priority:"high", type:"面试", completed:false },
  { id:2, title:"提交字节跳动笔试", deadline:"明天 18:00", priority:"high", type:"笔试", completed:false },
  { id:3, title:"更新简历作品集", deadline:"后天", priority:"medium", type:"材料", completed:false },
  { id:4, title:"阿里HR面试准备", deadline:"周五 10:00", priority:"medium", type:"面试", completed:false },
];
const defaultReviews = [
  { id:1, title:"腾讯产品经理一面复盘", company:"腾讯", position:"产品经理实习生", date:"2024-01-22", rating:4, tags:["项目深挖","产品设计"], content:"面试官主要围绕过往项目经历展开...", improvement:"需要加强对数据指标的敏感度" },
  { id:2, title:"字节产品运营面试复盘", company:"字节跳动", position:"产品运营", date:"2024-01-18", rating:3, tags:["案例分析","运营思路"], content:"案例分析题比较有挑战性...", improvement:"提前了解公司业务，练习案例分析框架" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const statusColor = s => ({ "面试中":"#3b82f6","笔试中":"#f59e0b","HR面":"#10b981","已投递":"#6b7280","已offer":"#22c55e","已拒绝":"#ef4444" }[s] || "#6b7280");
const priorityBg   = p => ({ high:"#fee2e2", medium:"#fef9c3", low:"#f3f4f6" }[p] || "#f3f4f6");
const priorityText = p => ({ high:"#b91c1c", medium:"#92400e", low:"#6b7280" }[p] || "#6b7280");

function useStoredData(key, fallback) {
  const [data, setData]   = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    db.get(key).then(val => {
      setData(val !== null ? val : fallback);
      if (val === null) db.set(key, fallback);
      setReady(true);
    });
  }, [key]);
  const save = async newData => { setData(newData); await db.set(key, newData); };
  return [data, save, ready];
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────
const Badge = ({ children, style }) => (
  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:600, display:"inline-block", whiteSpace:"nowrap", ...style }}>{children}</span>
);
const Card = ({ children, style, onClick }) => (
  <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 1px 8px rgba(0,0,0,.07)", overflow:"hidden", cursor:onClick?"pointer":"default", ...style }} onClick={onClick}>{children}</div>
);
const Btn = ({ children, variant="primary", size="md", style, disabled, onClick }) => {
  const base = { borderRadius:10, border:"none", cursor:disabled?"not-allowed":"pointer", fontWeight:600, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, transition:"opacity .15s", opacity:disabled?.5:1 };
  const v = {
    primary: { background:"#3b82f6", color:"#fff", padding:size==="sm"?"6px 14px":"10px 22px", fontSize:size==="sm"?13:15 },
    ghost:   { background:"transparent", color:"#3b82f6", padding:size==="sm"?"6px 10px":"10px 16px", fontSize:size==="sm"?13:15 },
    danger:  { background:"#fee2e2", color:"#b91c1c", padding:"10px 20px", fontSize:15 },
    outline: { background:"#fff", border:"1.5px solid #e5e7eb", color:"#374151", padding:size==="sm"?"5px 12px":"9px 18px", fontSize:size==="sm"?13:15 },
    success: { background:"#f0fdf4", color:"#166534", border:"1.5px solid #bbf7d0", padding:size==="sm"?"5px 12px":"9px 18px", fontSize:size==="sm"?13:15 },
  };
  return <button style={{ ...base, ...v[variant], ...style }} disabled={disabled} onClick={onClick}>{children}</button>;
};
const Input = ({ style, ...p }) => (
  <input style={{ background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 14px", fontSize:14, width:"100%", outline:"none", boxSizing:"border-box", ...style }} {...p} />
);
const Textarea = ({ style, ...p }) => (
  <textarea style={{ background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 14px", fontSize:14, width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box", ...style }} {...p} />
);
const ClaudeIcon = ({ size = 20, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.5 8.5L22 10L17 15.5L18.5 22L12 19L5.5 22L7 15.5L2 10L8.5 8.5L12 2Z"
      fill={active ? "#3b82f6" : "#9ca3af"} />
    <circle cx="12" cy="12" r="3" fill="white"/>
  </svg>
);
const BackBtn = ({ onClick }) => (
  <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:4, marginRight:4 }} onClick={onClick}>
    <Icon d={icons.arrowLeft} size={22} color="#1e293b" />
  </button>
);
const PageHeader = ({ title, onBack, right }) => (
  <div style={{ background:"#fff", padding:"20px 16px 14px", boxShadow:"0 1px 0 #f0f0f0", display:"flex", alignItems:"center", gap:4, position:"sticky", top:0, zIndex:10 }}>
    {onBack && <BackBtn onClick={onBack} />}
    <h1 style={{ margin:0, fontSize:18, fontWeight:800, flex:1 }}>{title}</h1>
    {right}
  </div>
);
const LoadingSpinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
    <div style={{ width:28, height:28, border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
const BottomNav = ({ page, setPage }) => {
  const items = [
    { key:"dashboard", icon:icons.dashboard, label:"看板" },
    { key:"review",    icon:icons.fileText,  label:"记录" },
    { key:"calendar",  label:"日历", isCalendar:true },
    { key:"ai",        isClaudeIcon:true,    label:"AI" },
    { key:"settings",  icon:icons.settings,  label:"我的" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, width:"min(430px, 100vw)", left:"50%", transform:"translateX(-50%)", background:"#fff", borderTop:"1px solid #f0f0f0", display:"flex", padding:"8px 0 env(safe-area-inset-bottom, 16px)", zIndex:100, boxSizing:"border-box" }}>
      {items.map(it => {
        const active = page === it.key;
        return (
          <button key={it.key} onClick={() => setPage(it.key)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", color:active?"#3b82f6":"#9ca3af", padding:"4px 0" }}>
            {it.isCalendar ? <CalIcon size={20} color={active?"#3b82f6":"#9ca3af"} /> : it.isClaudeIcon ? <ClaudeIcon size={20} active={active} /> : <Icon d={it.icon} size={20} color={active?"#3b82f6":"#9ca3af"} />}
            <span style={{ fontSize:11, fontWeight:active?700:500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── FAB + 菜单（首页右下角悬浮按钮，展开后显示两个选项）──────────────────────
const FAB = ({ onAddApp, onSyncMail, mailBound }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"fixed", right:16, bottom:88, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, zIndex:50 }}>
      {open && (
        <>
          {/* 遮罩：点空白关闭 */}
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:-1 }} />
          {/* 选项1：同步邮件 */}
          <div style={{ display:"flex", alignItems:"center", gap:10, animation:"fabIn .18s ease" }}>
            <span style={{ background:"#fff", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600, color:"#1e293b", boxShadow:"0 2px 12px rgba(0,0,0,.12)", whiteSpace:"nowrap" }}>
              {mailBound ? "同步邮件" : "绑定邮箱"}
            </span>
            <button onClick={() => { setOpen(false); onSyncMail(); }}
              style={{ width:46, height:46, borderRadius:"50%", background:mailBound?"#6366f1":"#8b5cf6", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(99,102,241,.4)" }}>
              <Icon d={icons.mail} size={20} color="#fff" />
            </button>
          </div>
          {/* 选项2：添加申请 */}
          <div style={{ display:"flex", alignItems:"center", gap:10, animation:"fabIn .12s ease" }}>
            <span style={{ background:"#fff", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600, color:"#1e293b", boxShadow:"0 2px 12px rgba(0,0,0,.12)", whiteSpace:"nowrap" }}>手动添加申请</span>
            <button onClick={() => { setOpen(false); onAddApp(); }}
              style={{ width:46, height:46, borderRadius:"50%", background:"#3b82f6", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(59,130,246,.4)" }}>
              <Icon d={icons.edit} size={20} color="#fff" />
            </button>
          </div>
        </>
      )}
      {/* 主 FAB 按钮 */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:56, height:56, borderRadius:"50%", background:"rgba(59,130,246,.25)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(59,130,246,.4)", boxShadow:"4px 4px 16px rgba(59,130,246,.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"transform .2s", transform:open?"rotate(45deg)":"rotate(0deg)" }}>
        <Icon d={icons.plus} size={22} color="#1d4ed8" />
      </button>
      <style>{`@keyframes fabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ setPage, setDetailId }) => {
  const [apps,  saveApps,  appsReady]  = useStoredData("apps",  defaultApps);
  const [todos, saveTodos, todosReady] = useStoredData("todos", defaultTodos);
  const [mailCfg] = useStoredData("mailConfig", null);
  const [fadingId, setFadingId] = useState(null);

  if (!appsReady || !todosReady) return <LoadingSpinner />;

  const stats = [
    { label:"进行中", count:apps.filter(a => !["已offer","已拒绝"].includes(a.status)).length, color:"#3b82f6", bg:"#eff6ff" },
    { label:"已提交", count:apps.length,                                                        color:"#f59e0b", bg:"#fffbeb" },
    { label:"已offer", count:apps.filter(a => a.status==="已offer").length,                    color:"#22c55e", bg:"#f0fdf4" },
    { label:"已拒绝", count:apps.filter(a => a.status==="已拒绝").length,                      color:"#ef4444", bg:"#fef2f2" },
  ];
  const pending = todos.filter(t => !t.completed);

  const handleToggle = id => {
    if (fadingId) return;
    setFadingId(id);
    setTimeout(() => {
      const updated = todos.map(t => t.id === id ? { ...t, completed:true } : t);
      saveTodos(updated); setFadingId(null);
    }, 500);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      {/* 顶部 */}
      <div style={{ background:"#fff", padding:"24px 16px 14px", boxShadow:"0 1px 0 #f0f0f0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:"#0f172a" }}>求职进度</h1>
            <p style={{ fontSize:12, color:"#94a3b8", margin:"4px 0 0" }}>加油！已有 {stats[2].count} 个offer在向你招手</p>
          </div>
          <div style={{ position:"relative", padding:4 }}>
            <Icon d={icons.bell} size={22} color="#64748b" />
            <span style={{ position:"absolute", top:0, right:0, width:16, height:16, background:"#ef4444", borderRadius:"50%", fontSize:10, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
          </div>
        </div>
        <div style={{ position:"relative" }}>
          <Icon d={icons.search} size={16} color="#94a3b8" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
          <input placeholder="搜索公司、职位..." readOnly style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"9px 14px 9px 36px", fontSize:14, width:"100%", outline:"none", boxSizing:"border-box", color:"#94a3b8" }} />
        </div>
      </div>

      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        {/* 统计 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {stats.map((s,i) => (
            <Card key={i} style={{ padding:"14px 16px" }} onClick={() => setPage("applications")}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.count}</span>
                </div>
                <span style={{ fontSize:13, color:"#64748b" }}>{s.label}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* 邮件同步快捷入口 */}
        <div
          onClick={() => setPage("mailSync")}
          style={{ background:"linear-gradient(135deg,#e8f0fe 0%,#f3e8fd 50%,#e8f5fe 100%)", borderRadius:16, padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, boxShadow:"0 1px 6px rgba(99,102,241,.08)", border:"1px solid rgba(99,102,241,.12)" }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#4285f4,#9b59b6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(66,133,244,.3)" }}>
            <Icon d={icons.mail} size={20} color="#fff" />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1e293b" }}>同步邮件</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>
              {mailCfg?.email ? `已绑定 ${mailCfg.provider}，点击同步面试邮件` : "绑定邮箱，自动识别面试邀请"}
            </p>
          </div>
          <Icon d={icons.chevronRight} size={18} color="#94a3b8" />
        </div>

        {/* 待办 */}
        <Card style={{ padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              <Icon d={icons.check} size={16} color="#3b82f6" /> 待办事项
            </h2>
            <button style={{ color:"#3b82f6", fontSize:13, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:2 }} onClick={() => setPage("todos")}>
              查看全部 <Icon d={icons.chevronRight} size={14} />
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pending.slice(0,3).map(todo => (
              <div key={todo.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#f8fafc", borderRadius:10, transition:"all .4s", opacity:fadingId===todo.id?0:1, transform:fadingId===todo.id?"translateX(30px)":"none" }}>
                <button onClick={() => handleToggle(todo.id)} style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0, padding:0, display:"flex" }}>
                  <Icon d={icons.circle} size={20} color="#d1d5db" />
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{todo.title}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{todo.deadline}</p>
                </div>
                <Badge style={{ background:priorityBg(todo.priority), color:priorityText(todo.priority) }}>{todo.type}</Badge>
              </div>
            ))}
            {pending.length === 0 && <p style={{ textAlign:"center", color:"#94a3b8", fontSize:14, padding:"8px 0" }}>暂无待办</p>}
          </div>
        </Card>

        {/* 最近申请 */}
        <Card style={{ padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              <Icon d={icons.briefcase} size={16} color="#3b82f6" /> 最近申请
            </h2>
            <button style={{ color:"#3b82f6", fontSize:13, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:2 }} onClick={() => setPage("applications")}>
              查看全部 <Icon d={icons.chevronRight} size={14} />
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {apps.slice(0,3).map(app => (
              <div key={app.id} style={{ display:"flex", alignItems:"center", gap:12, padding:12, background:"#f8fafc", borderRadius:12, cursor:"pointer" }}
                onClick={() => { setDetailId(app.id); setPage("appDetail"); }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>{app.logo}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#1e293b" }}>{app.company}</p>
                  <p style={{ margin:"2px 0 4px", fontSize:12, color:"#94a3b8" }}>{app.position}</p>
                  <div style={{ height:4, background:"#e2e8f0", borderRadius:2 }}>
                    <div style={{ height:"100%", background:"#3b82f6", width:`${app.progress}%`, borderRadius:2 }} />
                  </div>
                </div>
                <Badge style={{ background:statusColor(app.status)+"20", color:statusColor(app.status) }}>{app.status}</Badge>
              </div>
            ))}
            {apps.length === 0 && <p style={{ textAlign:"center", color:"#94a3b8", fontSize:14, padding:"8px 0" }}>暂无申请记录</p>}
          </div>
        </Card>
      </div>

      {/* FAB 悬浮菜单 */}
      <FAB
        mailBound={!!(mailCfg?.email)}
        onAddApp={() => setPage("addApp")}
        onSyncMail={() => setPage("mailSync")}
      />
    </div>
  );
};

// ─── Applications ──────────────────────────────────────────────────────────────
const Applications = ({ setPage, setDetailId }) => {
  const [apps, saveApps, ready] = useStoredData("apps", defaultApps);
  const [tab, setTab] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  if (!ready) return <><PageHeader title="申请管理" onBack={() => setPage("dashboard")} /><LoadingSpinner /></>;
  const tabs = ["all","面试中","笔试中","HR面","已offer","已拒绝"];
  const tabLabels = { all:"全部","面试中":"面试","笔试中":"笔试","HR面":"HR面","已offer":"Offer","已拒绝":"已拒" };
  const filtered = tab==="all" ? apps : apps.filter(a => a.status===tab);
  const handleDelete = id => { saveApps(apps.filter(a => a.id!==id)); setDeleteId(null); };
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      <PageHeader title="申请管理" onBack={() => setPage("dashboard")} right={<Btn size="sm" onClick={() => setPage("addApp")}><Icon d={icons.plus} size={14} />添加</Btn>} />
      <div style={{ background:"#fff", padding:"0 16px", borderBottom:"1px solid #f0f0f0" }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 0", scrollbarWidth:"none" }}>
          {tabs.map(t => <button key={t} onClick={() => setTab(t)} style={{ flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, background:tab===t?"#3b82f6":"#f1f5f9", color:tab===t?"#fff":"#64748b" }}>{tabLabels[t]}</button>)}
        </div>
      </div>
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(app => (
          <Card key={app.id} style={{ padding:16 }} onClick={() => { setDetailId(app.id); setPage("appDetail"); }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:15, flexShrink:0 }}>{app.logo}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:700 }}>{app.company}</p>
                    <p style={{ margin:"2px 0", fontSize:13, color:"#64748b" }}>{app.position}</p>
                  </div>
                  <Badge style={{ background:statusColor(app.status)+"18", color:statusColor(app.status), flexShrink:0 }}>{app.status}</Badge>
                </div>
                <div style={{ display:"flex", gap:12, marginTop:6, fontSize:12, color:"#94a3b8", flexWrap:"wrap" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon d={icons.mapPin} size={12} />{app.location}</span>
                  <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon d={icons.dollarSign} size={12} />{app.salary}</span>
                  <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon d={icons.clock} size={12} />{app.updateTime}</span>
                </div>
                <div style={{ marginTop:8, height:4, background:"#e2e8f0", borderRadius:2 }}>
                  <div style={{ height:"100%", background:statusColor(app.status), width:`${app.progress}%`, borderRadius:2 }} />
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setDeleteId(app.id); }} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
                <Icon d={icons.trash} size={16} color="#d1d5db" />
              </button>
            </div>
          </Card>
        ))}
        {filtered.length===0 && <p style={{ textAlign:"center", color:"#94a3b8", padding:32 }}>暂无记录</p>}
      </div>
      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:"#fff", borderRadius:20, padding:24, width:"100%", maxWidth:300 }}>
            <h3 style={{ margin:"0 0 8px", fontSize:17, fontWeight:700 }}>确认删除？</h3>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20 }}>此操作无法撤销</p>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="outline" style={{ flex:1 }} onClick={() => setDeleteId(null)}>取消</Btn>
              <Btn variant="danger"  style={{ flex:1 }} onClick={() => handleDelete(deleteId)}>删除</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Add Application ───────────────────────────────────────────────────────────
const AddApplication = ({ setPage }) => {
  const [apps, saveApps] = useStoredData("apps", defaultApps);
  const [form, setForm]   = useState({ company:"", position:"", status:"已投递", location:"", salary:"", tags:"" });
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const parseWithAI = async () => {
    if (!aiText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/ai-proxy", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ max_tokens:500,
          system: '从JD文本提取信息，只返回JSON，格式：{"company":string,"position":string,"location":string,"salary":string,"tags":string}',
          messages:[{ role:"user", content:aiText }] }) });
      const data = await res.json();
      const json = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g,"").trim()||"{}");
      setForm(f => ({ ...f, ...json }));
    } catch { alert("解析失败，请手动填写"); }
    setLoading(false);
  };
  const handleSave = async () => {
    if (!form.company||!form.position) return alert("请填写公司和职位");
    const newApp = { ...form, id:Date.now(), progress:10, updateTime:"刚刚", logo:form.company.charAt(0), tags:form.tags?form.tags.split(",").map(t=>t.trim()):[] };
    await saveApps([newApp, ...(apps||[])]);
    setPage("applications");
  };
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:40 }}>
      <PageHeader title="添加申请" onBack={() => setPage("applications")} />
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <Card style={{ padding:16 }}>
          <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700 }}>🤖 AI智能解析 JD</h3>
          <Textarea placeholder="粘贴职位描述或邮件..." value={aiText} onChange={e => setAiText(e.target.value)} style={{ minHeight:80, marginBottom:10 }} />
          <Btn onClick={parseWithAI} style={{ width:"100%" }} disabled={loading||!aiText.trim()}>{loading?"解析中...":"AI解析填写"}</Btn>
        </Card>
        <Card style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {[["company","公司名称 *"],["position","职位 *"],["location","工作地点"],["salary","薪资范围"],["tags","标签（逗号分隔）"]].map(([k,l]) => (
            <div key={k}><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{l}</label>
              <Input value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={l.replace(" *","")} /></div>
          ))}
          <div><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>当前状态</label>
            <select value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value}))} style={{ background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 14px", fontSize:14, width:"100%", outline:"none" }}>
              {["已投递","笔试中","面试中","HR面","已offer","已拒绝"].map(s => <option key={s}>{s}</option>)}
            </select></div>
        </Card>
        <Btn onClick={handleSave} style={{ width:"100%", padding:14 }}>保存申请</Btn>
      </div>
    </div>
  );
};

// ─── App Detail ────────────────────────────────────────────────────────────────
const AppDetail = ({ id, setPage }) => {
  const [apps,,ready] = useStoredData("apps", defaultApps);
  if (!ready) return <LoadingSpinner />;
  const app = apps?.find(a => a.id===id);
  if (!app) { setTimeout(() => setPage("applications"), 0); return null; }
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:40 }}>
      <PageHeader title="申请详情" onBack={() => setPage("applications")} />
      <div style={{ padding:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:20 }}>{app.logo}</div>
            <div><h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{app.company}</h2><p style={{ margin:"4px 0 0", color:"#64748b" }}>{app.position}</p></div>
          </div>
          <Badge style={{ background:statusColor(app.status)+"18", color:statusColor(app.status), fontSize:13, marginBottom:16 }}>{app.status}</Badge>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {[["地点",app.location,icons.mapPin],["薪资",app.salary,icons.dollarSign],["更新",app.updateTime,icons.clock]].map(([l,v,ic]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:10, fontSize:14 }}>
                <Icon d={ic} size={16} color="#94a3b8" /><span style={{ color:"#94a3b8" }}>{l}：</span><span style={{ color:"#334155" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}><span style={{ color:"#64748b" }}>进度</span><span style={{ fontWeight:700 }}>{app.progress}%</span></div>
            <div style={{ height:8, background:"#e2e8f0", borderRadius:4 }}><div style={{ height:"100%", background:statusColor(app.status), width:`${app.progress}%`, borderRadius:4 }} /></div>
          </div>
          {app.tags?.length>0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{app.tags.map(t => <Badge key={t} style={{ background:"#f1f5f9", color:"#475569" }}>{t}</Badge>)}</div>}
          {app.fromEmail && <div style={{ marginTop:14, padding:10, background:"#f0fdf4", borderRadius:10, fontSize:12, color:"#166534", display:"flex", alignItems:"center", gap:6 }}><Icon d={icons.mail} size={14} color="#166534" />从邮件自动导入</div>}
        </Card>
      </div>
    </div>
  );
};

// ─── Todos ─────────────────────────────────────────────────────────────────────
const Todos = ({ setPage }) => {
  const [todos, saveTodos, ready] = useStoredData("todos", defaultTodos);
  const [tab, setTab]     = useState("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]   = useState({ title:"", deadline:"", priority:"medium", type:"面试" });
  if (!ready) return <><PageHeader title="待办事项" onBack={() => setPage("dashboard")} /><LoadingSpinner /></>;
  const pending = todos.filter(t => !t.completed);
  const done    = todos.filter(t =>  t.completed);
  const shown   = tab==="pending" ? pending : done;
  const addTodo = async () => {
    if (!form.title) return;
    await saveTodos([...todos, { ...form, id:Date.now(), completed:false }]);
    setShowAdd(false); setForm({ title:"", deadline:"", priority:"medium", type:"面试" });
  };
  const toggle = id => saveTodos(todos.map(t => t.id===id ? {...t,completed:!t.completed} : t));
  const remove = id => saveTodos(todos.filter(t => t.id!==id));
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      <PageHeader title="待办事项" onBack={() => setPage("dashboard")} right={<Btn size="sm" onClick={() => setShowAdd(true)}><Icon d={icons.plus} size={14} />添加</Btn>} />
      <div style={{ background:"#fff", padding:"0 16px", borderBottom:"1px solid #f0f0f0" }}>
        <div style={{ display:"flex", gap:6, padding:"10px 0" }}>
          {[["pending",`待完成(${pending.length})`],["done",`已完成(${done.length})`]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding:"6px 16px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, background:tab===k?"#3b82f6":"#f1f5f9", color:tab===k?"#fff":"#64748b" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:8 }}>
        {shown.map(todo => (
          <Card key={todo.id} style={{ padding:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={() => toggle(todo.id)} style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0, padding:0, display:"flex" }}>
                <Icon d={todo.completed?icons.checkCircle:icons.circle} size={22} color={todo.completed?"#22c55e":"#d1d5db"} />
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:600, color:todo.completed?"#94a3b8":"#1e293b", textDecoration:todo.completed?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{todo.title}</p>
                {todo.deadline && <p style={{ margin:"3px 0 0", fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4 }}><Icon d={icons.clock} size={12} />{todo.deadline}</p>}
              </div>
              <Badge style={{ background:priorityBg(todo.priority), color:priorityText(todo.priority) }}>{todo.type}</Badge>
              <button onClick={() => remove(todo.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}><Icon d={icons.x} size={14} color="#d1d5db" /></button>
            </div>
          </Card>
        ))}
        {shown.length===0 && <p style={{ textAlign:"center", color:"#94a3b8", padding:32 }}>暂无{tab==="pending"?"待完成":"已完成"}项目</p>}
      </div>
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end", zIndex:200 }}>
          <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:24, width:"100%", boxSizing:"border-box" }}>
            <h3 style={{ margin:"0 0 16px", fontWeight:700 }}>添加待办</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input placeholder="待办标题 *" value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} />
              <Input placeholder="截止时间（如：明天 18:00）" value={form.deadline} onChange={e => setForm(f => ({...f,deadline:e.target.value}))} />
              <div style={{ display:"flex", gap:10 }}>
                <select value={form.priority} onChange={e => setForm(f => ({...f,priority:e.target.value}))} style={{ flex:1, background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 12px", fontSize:14, outline:"none" }}>
                  <option value="high">高优先级</option><option value="medium">中优先级</option><option value="low">低优先级</option>
                </select>
                <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))} style={{ flex:1, background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 12px", fontSize:14, outline:"none" }}>
                  {["面试","笔试","材料","网申","其他"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Btn variant="outline" style={{ flex:1 }} onClick={() => setShowAdd(false)}>取消</Btn>
              <Btn style={{ flex:1 }} onClick={addTodo} disabled={!form.title}>添加</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Calendar ──────────────────────────────────────────────────────────────────
const CalendarView = () => {
  const [date, setDate]       = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const today = new Date();
  const year=date.getFullYear(), month=date.getMonth();
  const firstDay=new Date(year,month,1).getDay(), daysInMonth=new Date(year,month+1,0).getDate();
  const monthNames=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  const events=[
    { date:today, title:"腾讯面试", color:"#3b82f6", time:"14:00" },
    { date:today, title:"字节笔试截止", color:"#f59e0b", time:"23:59" },
    { date:new Date(year,month,today.getDate()+2), title:"阿里HR面", color:"#10b981", time:"10:00" },
  ];
  const hasEvent = d => events.some(e => e.date.getDate()===d && e.date.getMonth()===month && e.date.getFullYear()===year);
  const dayEvents = events.filter(e => e.date.getDate()===selected.getDate() && e.date.getMonth()===selected.getMonth());
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      <div style={{ background:"#fff", padding:"20px 16px 14px", boxShadow:"0 1px 0 #f0f0f0" }}>
        <h1 style={{ margin:"0 0 14px", fontSize:20, fontWeight:800 }}>日历</h1>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:6 }} onClick={() => setDate(new Date(year,month-1))}><Icon d={icons.chevronLeft} size={20} /></button>
          <span style={{ fontWeight:700, fontSize:16 }}>{year}年 {monthNames[month]}</span>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:6 }} onClick={() => setDate(new Date(year,month+1))}><Icon d={icons.chevronRight} size={20} /></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", textAlign:"center" }}>
          {["日","一","二","三","四","五","六"].map(d => <div key={d} style={{ fontSize:12, color:"#94a3b8", padding:"4px 0", fontWeight:600 }}>{d}</div>)}
          {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`} />)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
            const isToday = d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
            const isSel   = d===selected.getDate()&&month===selected.getMonth()&&year===selected.getFullYear();
            return (
              <div key={d} onClick={() => setSelected(new Date(year,month,d))} style={{ position:"relative", padding:"4px 0", cursor:"pointer" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:isSel?"#3b82f6":isToday?"#eff6ff":"transparent", color:isSel?"#fff":isToday?"#3b82f6":"#334155", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", fontSize:14, fontWeight:isToday||isSel?700:400 }}>{d}</div>
                {hasEvent(d) && <div style={{ position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#3b82f6" }} />}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding:16 }}>
        <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 10px", color:"#64748b" }}>{selected.getMonth()+1}月{selected.getDate()}日 事件</h3>
        {dayEvents.length>0 ? dayEvents.map((e,i) => (
          <Card key={i} style={{ padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:4, height:36, borderRadius:2, background:e.color, flexShrink:0 }} />
            <div><p style={{ margin:0, fontWeight:700, fontSize:14 }}>{e.title}</p><p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{e.time}</p></div>
          </Card>
        )) : <p style={{ color:"#94a3b8", fontSize:14 }}>今日暂无安排</p>}
      </div>
    </div>
  );
};

// ─── Review ────────────────────────────────────────────────────────────────────
const Review = ({ setPage, setReviewId }) => {
  const [reviews,,ready] = useStoredData("reviews", defaultReviews);
  if (!ready) return <><PageHeader title="面试复盘" /><LoadingSpinner /></>;
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      <PageHeader title="面试复盘" right={<Btn size="sm" onClick={() => setPage("reviewNew")}><Icon d={icons.plus} size={14} />新建</Btn>} />
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        {(reviews||[]).map(r => (
          <Card key={r.id} style={{ padding:16 }} onClick={() => { setReviewId(r.id); setPage("reviewDetail"); }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:15 }}>{r.title}</p>
                <p style={{ margin:"4px 0 0", fontSize:12, color:"#94a3b8" }}>{r.company} · {r.date}</p>
              </div>
              <div style={{ display:"flex", gap:1, flexShrink:0, marginLeft:8 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color:s<=r.rating?"#f59e0b":"#e2e8f0", fontSize:14 }}>★</span>)}</div>
            </div>
            <p style={{ margin:"0 0 10px", fontSize:13, color:"#64748b", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.content}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{r.tags.map(t => <Badge key={t} style={{ background:"#eff6ff", color:"#3b82f6" }}>{t}</Badge>)}</div>
          </Card>
        ))}
        {(!reviews||reviews.length===0) && <p style={{ textAlign:"center", color:"#94a3b8", padding:32 }}>暂无复盘记录</p>}
      </div>
    </div>
  );
};

const ReviewDetail = ({ id, setPage }) => {
  const [reviews,,ready] = useStoredData("reviews", defaultReviews);
  if (!ready) return <LoadingSpinner />;
  const r = reviews?.find(x => x.id===id);
  if (!r) { setTimeout(() => setPage("review"),0); return null; }
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:40 }}>
      <PageHeader title="复盘详情" onBack={() => setPage("review")} />
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <Card style={{ padding:20 }}>
          <h2 style={{ margin:"0 0 8px", fontSize:18, fontWeight:800 }}>{r.title}</h2>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ color:"#64748b", fontSize:13 }}>{r.company} · {r.position}</span>
            <div style={{ display:"flex", gap:1 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color:s<=r.rating?"#f59e0b":"#e2e8f0", fontSize:16 }}>★</span>)}</div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:16 }}>{r.tags.map(t => <Badge key={t} style={{ background:"#eff6ff", color:"#3b82f6" }}>{t}</Badge>)}</div>
          <div style={{ background:"#f8fafc", borderRadius:12, padding:14, marginBottom:12 }}>
            <h4 style={{ margin:"0 0 8px", fontSize:13, fontWeight:700, color:"#374151" }}>面试记录</h4>
            <p style={{ margin:0, fontSize:14, color:"#4b5563", lineHeight:1.7 }}>{r.content}</p>
          </div>
          {r.improvement && <div style={{ background:"#fffbeb", borderRadius:12, padding:14 }}>
            <h4 style={{ margin:"0 0 8px", fontSize:13, fontWeight:700, color:"#92400e" }}>改进方向</h4>
            <p style={{ margin:0, fontSize:14, color:"#78350f", lineHeight:1.7 }}>{r.improvement}</p>
          </div>}
        </Card>
      </div>
    </div>
  );
};

const ReviewNew = ({ setPage }) => {
  const [reviews, saveReviews] = useStoredData("reviews", defaultReviews);
  const [form, setForm] = useState({ title:"", company:"", position:"", rating:3, tags:"", content:"", improvement:"" });
  const [aiText, setAiText] = useState(""); const [loading, setLoading] = useState(false);
  const aiGenerate = async () => {
    if (!aiText.trim()&&!form.company) return alert("请输入面试描述");
    setLoading(true);
    try {
      const prompt = `公司：${form.company||"未知"}，职位：${form.position||"未知"}。面试描述：${aiText||form.content}。请生成面试复盘，只返回JSON：{"title":"","content":"","improvement":"","tags":"tag1,tag2"}`;
      const res = await fetch("/.netlify/functions/ai-proxy", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ max_tokens:800, system:"只返回JSON，不要其他内容", messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      const json = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g,"").trim()||"{}");
      setForm(f => ({ ...f, ...json, tags:json.tags||f.tags }));
    } catch { alert("AI生成失败，请手动填写"); }
    setLoading(false);
  };
  const handleSave = async () => {
    if (!form.title||!form.content) return alert("请填写标题和内容");
    const nr = { ...form, id:Date.now(), date:new Date().toISOString().split("T")[0], tags:form.tags?form.tags.split(",").map(t=>t.trim()):[] };
    await saveReviews([nr, ...(reviews||[])]);
    setPage("review");
  };
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:40 }}>
      <PageHeader title="新建复盘" onBack={() => setPage("review")} />
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <Card style={{ padding:16 }}>
          <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700 }}>🤖 AI辅助生成</h3>
          <Textarea placeholder="描述面试经过..." value={aiText} onChange={e => setAiText(e.target.value)} style={{ minHeight:80, marginBottom:10 }} />
          <Btn onClick={aiGenerate} style={{ width:"100%" }} disabled={loading}>{loading?"生成中...":"AI生成复盘"}</Btn>
        </Card>
        <Card style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {[["title","复盘标题 *"],["company","公司"],["position","职位"],["tags","标签（逗号分隔）"]].map(([k,l]) => (
            <div key={k}><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{l}</label><Input value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} /></div>
          ))}
          <div><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>评分</label>
            <div style={{ display:"flex", gap:6 }}>{[1,2,3,4,5].map(s => <button key={s} onClick={() => setForm(f=>({...f,rating:s}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:28, color:s<=form.rating?"#f59e0b":"#e2e8f0", padding:"0 2px" }}>★</button>)}</div>
          </div>
          <div><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>面试内容 *</label><Textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} placeholder="记录面试问题和你的回答..." style={{ minHeight:100 }} /></div>
          <div><label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>改进方向</label><Textarea value={form.improvement} onChange={e => setForm(f=>({...f,improvement:e.target.value}))} placeholder="哪些地方可以做得更好..." style={{ minHeight:80 }} /></div>
        </Card>
        <Btn onClick={handleSave} style={{ width:"100%", padding:14 }} disabled={!form.title||!form.content}>保存复盘</Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── T1: 邮件同步页（MailSync）— 完整版
// 架构：前端 → POST /.netlify/functions/fetch-emails → QQ IMAP
//       → 返回邮件列表 → Claude API 逐封解析 → 逐条预览确认 → 写入 apps
// ═══════════════════════════════════════════════════════════════════════════════
const MAIL_CONFIG_KEY   = "mailConfig";
const PROCESSED_IDS_KEY = "processedMailIds";

// ── Claude 解析单封邮件 ────────────────────────────────────────────────────────
const parseEmailWithClaude = async (fullText) => {
  const res = await fetch("/.netlify/functions/ai-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: 600,
      system: `你是求职邮件解析助手。只返回 JSON，不输出任何其他文字。
判断标准：只要邮件涉及求职、招聘、面试、笔试、offer、入职、实习等内容，isJobRelated 就返回 true。
格式：{
  "isJobRelated": true或false,
  "company": "公司名（没有则猜测发件方名称）",
  "position": "职位名（没有则填'待确认'）",
  "emailType": "面试邀请|笔试通知|offer|拒信|进度通知|其他",
  "status": "面试中|笔试中|已offer|已拒绝|已投递",
  "interviewTime": "面试时间字符串或null",
  "location": "工作地点或null",
  "salary": "薪资或null",
  "confidence": 0到1的数字,
  "summary": "一句话概括"
}`,
      messages: [{ role: "user", content: `邮件内容：\n\n${fullText}` }],
    }),
  });
  const data = await res.json();
  const raw = data.content?.[0]?.text || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
};

// ── 写入或更新申请 ────────────────────────────────────────────────────────────
const upsertApp = (current, parsed, uid) => {
  const exists = current.find(a =>
    a.company?.trim() === parsed.company?.trim() &&
    a.position?.trim() === parsed.position?.trim()
  );
  const statusProgress = { "已投递":10,"笔试中":30,"面试中":50,"HR面":75,"已offer":100,"已拒绝":0 };
  if (exists) {
    return current.map(a => a.id === exists.id
      ? { ...a, status: parsed.status || a.status, updateTime: "刚刚", fromEmail: true }
      : a
    );
  }
  return [{
    id:            Date.now() + Math.random(),
    company:       parsed.company   || "未知公司",
    position:      parsed.position  || "待确认",
    status:        parsed.status    || "已投递",
    location:      parsed.location  || "待确认",
    salary:        parsed.salary    || "待确认",
    progress:      statusProgress[parsed.status] ?? 10,
    updateTime:    "刚刚",
    logo:          (parsed.company || "?").charAt(0),
    tags:          [parsed.emailType].filter(Boolean),
    fromEmail:     true,
    interviewTime: parsed.interviewTime,
    lastEmailUid:  uid,
  }, ...current];
};

const MailSync = ({ setPage }) => {
  const [mailCfg, saveMailCfg, cfgReady] = useStoredData(MAIL_CONFIG_KEY, null);
  const [apps, saveApps]                  = useStoredData("apps", defaultApps);

  // 状态机：loading → setup → ready → syncing → review_batch → done | error
  const [step, setStep]     = useState("loading");
  const [errorMsg, setError] = useState("");

  // 绑定表单
  const [cfgForm, setCfgForm]     = useState({ email:"", authCode:"", name:"" });
  const [cfgSaving, setCfgSaving] = useState(false);

  // 同步进度日志
  const [syncLog, setSyncLog]   = useState([]);
  const [syncStats, setSyncStats] = useState(null);  // { total, fetched, newCount }

  // 手动粘贴模式
  const [manualText, setManualText] = useState("");
  const [manualParsing, setManualParsing] = useState(false);

  // 调试：所有邮件的解析结果（含被过滤的）
  const [debugList, setDebugList] = useState([]);
  const [showDebug, setShowDebug] = useState(true); // 默认展开

  // 批量确认队列
  const [pendingList, setPendingList]       = useState([]);
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [editForm, setEditForm]             = useState(null);
  const [savedCount, setSavedCount]         = useState(0);
  const [skippedCount, setSkippedCount]     = useState(0);

  useEffect(() => {
    if (!cfgReady) return;
    setStep(mailCfg?.email ? "ready" : "setup");
  }, [cfgReady, mailCfg]);

  // ── 绑定邮箱 ──────────────────────────────────────────────────────────────
  const handleBind = async () => {
    const email    = cfgForm.email.trim();
    const authCode = cfgForm.authCode.trim();
    if (!email || !authCode) return alert("请填写邮箱地址和授权码");
    setCfgSaving(true);
    await saveMailCfg({
      email, authCode,
      name:     cfgForm.name.trim() || email.split("@")[0],
      boundAt:  new Date().toISOString(),
      provider: email.includes("qq.com")    ? "QQ邮箱"  :
                email.includes("163.com")   ? "163邮箱" :
                email.includes("gmail.com") ? "Gmail"   : "邮箱",
    });
    setCfgSaving(false);
    setStep("ready");
  };

  const handleSync = async () => {
    setStep("syncing");
    setError("");
    setSyncLog([]);
    setSyncStats(null);
    setDebugList([]);

    // 每条日志记录等级 + 内容，方便用颜色区分
    const log = (msg, level = "info") =>
      setSyncLog(prev => [...prev, { msg, level, time: new Date().toLocaleTimeString() }]);

    try {
      log(`连接邮箱：${mailCfg.email}`);

      // ── 探测后端（带完整诊断）─────────────────────────────────────────────
      const endpoints = [
        "/.netlify/functions/fetch-emails",
        "/api/fetch-emails",
      ];

      const fetchWithTimeout = (url, opts, ms = 30000) => {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), ms);
        return fetch(url, { ...opts, signal: ctrl.signal })
          .finally(() => clearTimeout(tid));
      };

      let total = 0, fetched = 0, backendAvailable = false;
      const backendData    = {};   // 后端返回的完整 data
      const endpointErrors = [];   // 记录每个端点的真实错误

      for (const endpoint of endpoints) {
        log(`尝试后端接口：${endpoint}`);
        try {
          const res = await fetchWithTimeout(endpoint, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              email:    mailCfg.email,
              authCode: mailCfg.authCode,
              days: 30, limit: 50,
            }),
          });

          log(`${endpoint} 响应状态：HTTP ${res.status}`);

          // 任何非 2xx 都读取错误体
          if (!res.ok) {
            let errMsg = `HTTP ${res.status}`;
            try {
              const body = await res.json();
              errMsg = body.error || body.message || errMsg;
            } catch (_) {}
            endpointErrors.push(`${endpoint} → ${errMsg}`);
            log(`${endpoint} 失败：${errMsg}`, "error");
            // 401 授权码错误直接抛，不再尝试其他端点
            if (res.status === 401) throw new Error(errMsg);
            continue;
          }

          // 成功：保存完整返回数据供后续解析使用
          const data = await res.json();
          Object.assign(backendData, data);
          total    = data.total   || 0;
          fetched  = data.fetched || 0;
          backendAvailable = true;
          log(`后端连接成功 ✓`, "ok");
          log(`收件箱共 ${total} 封，过滤出 ${fetched} 封求职相关邮件`);
          break;

        } catch (e) {
          const reason = e.name === "AbortError"
            ? "连接超时（15s）"
            : e.message || String(e);
          endpointErrors.push(`${endpoint} → ${reason}`);
          log(`${endpoint} 异常：${reason}`, "error");
          if (e.message?.includes("授权码")) throw e;
        }
      }

      // ── 后端不可用：明确报错，让用户决定 ─────────────────────────────────
      if (!backendAvailable) {
        const detail = endpointErrors.join("\n");
        throw new Error(`后端接口无法连接，可能原因：\n\n${detail}\n\n请检查 Netlify 函数是否已正常部署，或切换到手动粘贴模式。`);
      }

      // ── 后端已完成 IMAP 拉取 + Claude 解析，直接用返回结果 ─────────────────
      // data.parsed   = 有效申请列表
      // data.parseLog = 每封邮件的解析摘要（含失败原因）
      // data.fetched  = 关键词过滤后的邮件数
      // data.total    = 收件箱总数
      const { parsed: serverParsed = [], parseLog = [] } = backendData;

      // 把 parseLog 同步到调试面板
      setDebugList(parseLog);
      parseLog.forEach(p => {
        if (p.error) {
          log(`  ✗ 解析失败（${p.subject?.slice(0,20)}）：${p.error}`, "error");
        } else if (p.isJobRelated) {
          log(`  ✓ ${p.company} · ${p.position} · ${p.emailType}`, "ok");
        } else {
          log(`  - 非求职：${p.summary || p.subject?.slice(0,20)}`);
        }
      });

      // ── 去重：过滤已处理 UID ─────────────────────────────────────────────
      const processedIds = (await db.get(PROCESSED_IDS_KEY)) || [];
      const processedSet = new Set(processedIds);
      const newParsed    = serverParsed.filter(p => !processedSet.has(p.uid));

      // 更新已处理集合
      serverParsed.forEach(p => processedSet.add(p.uid));
      await db.set(PROCESSED_IDS_KEY, [...processedSet].slice(-500));

      log(`解析完成，共 ${newParsed.length} 条新申请`, newParsed.length > 0 ? "ok" : "info");
      setSyncStats({ total, fetched, newCount: newParsed.length });

      if (newParsed.length === 0) {
        setStep("done");
        return;
      }

      setPendingList(newParsed);
      setCurrentIdx(0);
      setEditForm(buildEditForm(newParsed[0]));
      setSavedCount(0);
      setSkippedCount(0);
      setStep("review_batch");

    } catch (err) {
      log(`错误：${err.message}`);
      setError(err.message || "同步失败");
      setStep("error");
    }
  };

  const buildEditForm = p => ({
    company:       p.company       || "",
    position:      p.position      || "待确认",
    status:        p.status        || "已投递",
    location:      p.location      || "",
    salary:        p.salary        || "",
    interviewTime: p.interviewTime || "",
    emailType:     p.emailType     || "其他",
    confidence:    p.confidence    ?? 0.8,
    summary:       p.summary       || "",
    isJobRelated:  p.isJobRelated  ?? true,
    uid:           p.uid,
    subject:       p.subject       || "",
  });

  // ── 确认写入 ──────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!editForm.company || !editForm.position) return alert("公司和职位不能为空");
    const cur     = (await db.get("apps")) || apps || [];
    const updated = upsertApp(cur, editForm, editForm.uid);
    await saveApps(updated);
    setSavedCount(c => c + 1);
    goNext();
  };

  const handleSkip = () => { setSkippedCount(c => c + 1); goNext(); };

  const goNext = () => {
    const next = currentIdx + 1;
    if (next >= pendingList.length) {
      setStep("done");
    } else {
      setCurrentIdx(next);
      setEditForm(buildEditForm(pendingList[next]));
    }
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  if (!cfgReady || step === "loading") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <PageHeader title="邮件同步" onBack={() => setPage("dashboard")} />
      <LoadingSpinner />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:40 }}>
      <PageHeader
        title={step === "setup" ? "绑定邮箱" : "同步邮件"}
        onBack={() => setPage("dashboard")}
      />

      {/* ══ SETUP ══ */}
      {step === "setup" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:16 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon d={icons.mail} size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin:"0 0 4px", fontWeight:700, fontSize:15 }}>绑定邮箱，一键同步面试邮件</p>
                <p style={{ margin:0, fontSize:13, color:"#64748b", lineHeight:1.6 }}>支持 QQ邮箱、163、Gmail。绑定后一键拉取，AI 自动识别面试邀请并生成申请记录。</p>
              </div>
            </div>
          </Card>

          <Card style={{ padding:16, background:"#fffbeb" }}>
            <p style={{ margin:"0 0 8px", fontWeight:700, fontSize:13, color:"#92400e" }}>📌 QQ邮箱授权码获取</p>
            <div style={{ fontSize:12, color:"#78350f", lineHeight:1.9 }}>
              <div>1. 登录 QQ邮箱 → 设置 → 账户</div>
              <div>2. 开启 IMAP/SMTP 服务</div>
              <div>3. 按提示发短信，获取 16 位授权码</div>
              <div style={{ marginTop:4, color:"#b45309", fontWeight:600 }}>授权码仅在本地存储，不经过任何第三方</div>
            </div>
          </Card>

          <Card style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>邮箱地址 *</label>
              <Input type="email" placeholder="yourname@qq.com" value={cfgForm.email}
                onChange={e => setCfgForm(f => ({...f, email:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>授权码 *（非邮箱密码）</label>
              <Input type="password" placeholder="16 位授权码" value={cfgForm.authCode}
                onChange={e => setCfgForm(f => ({...f, authCode:e.target.value}))} />
              <p style={{ margin:"5px 0 0", fontSize:11, color:"#94a3b8" }}>仅在本地存储，不上传到任何服务器</p>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>备注名（选填）</label>
              <Input placeholder="如：我的 QQ 邮箱" value={cfgForm.name}
                onChange={e => setCfgForm(f => ({...f, name:e.target.value}))} />
            </div>
          </Card>
          <Btn onClick={handleBind} style={{ width:"100%", padding:14 }}
            disabled={cfgSaving || !cfgForm.email || !cfgForm.authCode}>
            {cfgSaving ? "绑定中..." : "完成绑定"}
          </Btn>
        </div>
      )}

      {/* ══ READY ══ */}
      {step === "ready" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon d={icons.mail} size={22} color="#16a34a" />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{mailCfg?.provider} 已绑定</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>{mailCfg?.email}</p>
              </div>
              <button onClick={() => setStep("setup")}
                style={{ fontSize:12, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}>更换</button>
            </div>
          </Card>
          <Card style={{ padding:16 }}>
            <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14 }}>同步说明</p>
            {[
              ["拉取近 30 天邮件", "后端自动过滤面试/笔试/offer 关键词"],
              ["AI 逐封解析", "提取公司、职位、状态、面试时间"],
              ["增量去重", "已处理邮件不会重复导入"],
              ["逐条确认", "可编辑字段后再写入申请"],
            ].map(([t, d]) => (
              <div key={t} style={{ display:"flex", gap:10, marginBottom:10 }}>
                <Icon d={icons.checkCircle} size={16} color="#16a34a" style={{ marginTop:2, flexShrink:0 }} />
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{t}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>{d}</p>
                </div>
              </div>
            ))}
          </Card>
          <Btn onClick={handleSync} style={{ width:"100%", padding:14 }}>
            <Icon d={icons.refresh} size={18} color="#fff" />一键同步邮件
          </Btn>
        </div>
      )}

      {/* ══ SYNCING ══ */}
      {step === "syncing" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:24 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:32, height:32, border:"3px solid #bfdbfe", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
              </div>
            </div>
            <p style={{ textAlign:"center", fontWeight:700, fontSize:15, marginBottom:16 }}>正在同步邮件...</p>
            <div style={{ background:"#f8fafc", borderRadius:10, padding:12, maxHeight:220, overflowY:"auto", display:"flex", flexDirection:"column", gap:5 }}>
              {syncLog.length === 0 && <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>连接中...</p>}
              {syncLog.map((item, i) => {
                const msg   = typeof item === "string" ? item : item.msg;
                const level = typeof item === "string" ? "info" : (item.level || "info");
                const color = level==="ok" ? "#16a34a" : level==="error" ? "#dc2626" : level==="warn" ? "#d97706" : "#475569";
                return (
                  <p key={i} style={{ margin:0, fontSize:12, display:"flex", alignItems:"flex-start", gap:6, color }}>
                    <span style={{ color:"#cbd5e1", flexShrink:0, fontVariantNumeric:"tabular-nums" }}>
                      {String(i+1).padStart(2,"0")}.
                    </span>
                    <span style={{ wordBreak:"break-all" }}>{msg}</span>
                  </p>
                );
              })}
            </div>
          </Card>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ══ MANUAL：后端不可用，手动粘贴邮件 ══ */}
      {step === "manual" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ padding:"12px 16px", background:"#f0f9ff" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Icon d={icons.mail} size={16} color="#0369a1" />
              <p style={{ margin:0, fontSize:13, color:"#0369a1", fontWeight:600 }}>
                粘贴邮件原文，AI 自动提取申请信息
              </p>
            </div>
          </Card>
          <Card style={{ padding:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:10 }}>粘贴邮件原文</label>
            <Textarea
              placeholder={"粘贴邮件全文，例如：\n\n发件人：hr@company.com\n主题：【腾讯】产品经理面试邀请\n\n您好，感谢您投递..."}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              style={{ minHeight:180, marginBottom:12, fontSize:13 }}
            />
            <Btn onClick={async () => {
              if (!manualText.trim()) return;
              setManualParsing(true);
              try {
                const result = await parseEmailWithClaude(manualText);
                if (result.isJobRelated && result.company) {
                  const uid = "manual_" + Date.now();
                  const item = { ...result, uid, subject: "手动粘贴" };
                  setPendingList([item]);
                  setCurrentIdx(0);
                  setEditForm(buildEditForm(item));
                  setSavedCount(0); setSkippedCount(0);
                  setSyncStats({ total:1, fetched:1, newCount:1 });
                  setStep("review_batch");
                } else {
                  alert("未识别为求职邮件\n\n" + (result.summary || "请确认邮件包含面试/笔试/offer相关内容"));
                }
              } catch(e) { alert("解析失败：" + e.message); }
              setManualParsing(false);
            }} style={{ width:"100%" }} disabled={manualParsing || !manualText.trim()}>
              {manualParsing ? "解析中..." : <><Icon d={icons.refresh} size={16} color="#fff" />AI 解析邮件</>}
            </Btn>
          </Card>
          <Btn variant="outline" style={{ width:"100%" }} onClick={() => setStep("ready")}>返回</Btn>
        </div>
      )}

      {/* ══ REVIEW_BATCH：逐条预览 ══ */}
      {step === "review_batch" && editForm && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
          {/* 进度条 */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:4, background:"#e2e8f0", borderRadius:2 }}>
              <div style={{ height:"100%", background:"#6366f1", borderRadius:2,
                width:`${((currentIdx)/pendingList.length)*100}%`, transition:"width .3s" }} />
            </div>
            <span style={{ fontSize:12, color:"#64748b", flexShrink:0 }}>{currentIdx+1} / {pendingList.length}</span>
          </div>

          {/* 邮件主题来源 */}
          <div style={{ fontSize:12, color:"#94a3b8", padding:"0 2px" }}>
            来源：{editForm.subject?.slice(0,40)}
          </div>

          {/* AI 判断横幅 */}
          {editForm.isJobRelated === false ? (
            <Card style={{ padding:"12px 16px", background:"#fefce8", border:"1.5px solid #fde047" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Icon d={icons.alertCircle} size={18} color="#ca8a04" />
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#854d0e" }}>
                    AI 认为这不是求职邮件
                  </p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:"#92400e" }}>
                    {editForm.summary || "你仍可编辑字段后手动写入"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card style={{ padding:"12px 16px", background: editForm.confidence >= 0.7 ? "#f0fdf4" : "#fff7ed" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Icon d={editForm.confidence >= 0.7 ? icons.checkCircle : icons.alertCircle}
                  size={18} color={editForm.confidence >= 0.7 ? "#16a34a" : "#ea580c"} />
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13,
                    color: editForm.confidence >= 0.7 ? "#166534" : "#92400e" }}>
                    {editForm.emailType} · 置信度 {Math.round((editForm.confidence||0)*100)}%
                  </p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>{editForm.summary}</p>
                </div>
              </div>
            </Card>
          )}

          {editForm.isJobRelated !== false && editForm.confidence < 0.7 && (
            <div style={{ padding:"8px 14px", background:"#fff7ed", borderRadius:10, fontSize:12, color:"#92400e" }}>
              置信度较低，请检查下方字段是否正确
            </div>
          )}

          {/* 可编辑字段 */}
          <Card style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            {[["company","公司 *"],["position","职位 *"],["location","地点"],["salary","薪资"],["interviewTime","面试时间"]].map(([k,l]) => (
              <div key={k}>
                <label style={{ fontSize:12, fontWeight:600,
                  color:(k==="company"||k==="position")&&!editForm[k]?"#ef4444":"#64748b",
                  display:"block", marginBottom:4 }}>{l}</label>
                <Input value={editForm[k]}
                  onChange={e => setEditForm(f => ({...f,[k]:e.target.value}))}
                  style={{ background:(k==="company"||k==="position")&&!editForm[k]?"#fef2f2":"#f3f4f6" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>状态</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({...f,status:e.target.value}))}
                style={{ background:"#f3f4f6", border:"none", borderRadius:10, padding:"10px 14px", fontSize:14, width:"100%", outline:"none" }}>
                {["已投递","笔试中","面试中","HR面","已offer","已拒绝"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </Card>

          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="outline" style={{ flex:1 }} onClick={handleSkip}>
              不是，跳过
            </Btn>
            <Btn
              style={{ flex:2, background: editForm.isJobRelated === false ? "#f59e0b" : undefined }}
              onClick={handleConfirm}
              disabled={!editForm.company || !editForm.position}
            >
              <Icon d={icons.checkSquare} size={16} color="#fff" />
              {editForm.isJobRelated === false ? "仍然写入" : "写入申请"}
            </Btn>
          </div>
        </div>
      )}

      {/* ══ ERROR ══ */}
      {step === "error" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          <Card style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon d={icons.alertCircle} size={22} color="#ef4444" />
              </div>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>同步失败</h3>
            </div>
            {/* 完整错误信息，换行保留 */}
            <div style={{ background:"#fef2f2", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
              <p style={{ margin:0, fontSize:12, color:"#b91c1c", whiteSpace:"pre-wrap", lineHeight:1.7, wordBreak:"break-all" }}>
                {errorMsg}
              </p>
            </div>
            {/* 同步日志（可展开查看详细过程）*/}
            {syncLog.length > 0 && (
              <div style={{ background:"#f8fafc", borderRadius:10, padding:"10px 12px", marginBottom:16, maxHeight:160, overflowY:"auto" }}>
                <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:600, color:"#94a3b8" }}>诊断日志</p>
                {syncLog.map((item, i) => {
                  const msg   = typeof item === "string" ? item : item.msg;
                  const level = typeof item === "object" ? (item.level||"info") : "info";
                  const color = level==="ok"?"#16a34a": level==="error"?"#dc2626": level==="warn"?"#d97706":"#64748b";
                  return (
                    <p key={i} style={{ margin:0, fontSize:11, color, display:"flex", gap:5, lineHeight:1.6 }}>
                      <span style={{ color:"#cbd5e1", flexShrink:0 }}>{String(i+1).padStart(2,"0")}.</span>
                      <span style={{ wordBreak:"break-all" }}>{msg}</span>
                    </p>
                  );
                })}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Btn onClick={() => setStep("ready")} style={{ width:"100%" }}>
                重新尝试
              </Btn>
              <Btn variant="outline" style={{ width:"100%" }} onClick={() => {
                setManualText(""); setStep("manual");
              }}>
                手动粘贴邮件内容
              </Btn>
              <Btn variant="outline" style={{ width:"100%" }} onClick={() => setStep("setup")}>
                重新绑定邮箱
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* ══ DONE ══ */}
      {step === "done" && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:28, textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <Icon d={icons.checkCircle} size={36} color="#16a34a" />
            </div>
            <h3 style={{ margin:"0 0 16px", fontSize:18, fontWeight:800 }}>同步完成</h3>
            <div style={{ display:"flex", justifyContent:"center", gap:28, marginBottom:24 }}>
              {[
                ["检测邮件", syncStats?.fetched ?? 0, "#3b82f6"],
                ["写入申请", savedCount,              "#16a34a"],
                ["已跳过",   skippedCount,             "#94a3b8"],
              ].map(([label, count, color]) => (
                <div key={label}>
                  <div style={{ fontSize:26, fontWeight:800, color }}>{count}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Btn onClick={() => setPage("applications")} style={{ width:"100%" }}>查看申请列表</Btn>
              <Btn variant="outline" style={{ width:"100%" }} onClick={() => {
                setSyncLog([]); setSyncStats(null); setDebugList([]);
                setSavedCount(0); setSkippedCount(0); setPendingList([]);
                setStep("ready");
              }}>再次同步</Btn>
            </div>
          </Card>

          {/* 解析详情：默认展开，每封邮件的 AI 判断结果一目了然 */}
          {debugList.length > 0 && (
            <Card style={{ padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#374151" }}>
                  解析详情（{debugList.length} 封）
                </span>
                <span style={{ fontSize:11, color:"#94a3b8" }}>
                  绿色=识别为求职 / 灰色=非求职
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {debugList.map((d, i) => (
                  <div key={i} style={{ padding:"10px 12px", background: d.isJobRelated ? "#f0fdf4" : "#f8fafc", borderRadius:10, borderLeft:`3px solid ${d.isJobRelated ? "#16a34a" : "#e2e8f0"}` }}>
                    <p style={{ margin:"0 0 3px", fontSize:12, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.subject}</p>
                    <p style={{ margin:0, fontSize:11, color: d.isJobRelated ? "#15803d" : "#94a3b8" }}>
                      {d.isJobRelated
                        ? `✓ ${d.company || "?"} · ${d.position || "?"} · ${d.emailType || "?"} · 置信度${Math.round((d.confidence||0)*100)}%`
                        : `✗ 非求职 · ${d.summary || "无摘要"}`
                      }
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AI Agent ──────────────────────────────────────────────────────────────────
const AIAgent = ({ setPage }) => {
  const [messages, setMessages] = useState([
    { id:1, role:"assistant", content:"你好！我是你的求职AI助手 🎯\n\n我可以帮你：\n• 解析JD提取职位信息\n• 生成面试复盘\n• 提供面试准备建议\n• 优化简历描述\n\n请发送JD文本或描述你的需求～" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);
  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, [messages]);
  const send = async () => {
    if (!input.trim()||loading) return;
    const userMsg = { id:Date.now(), role:"user", content:input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/ai-proxy", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ max_tokens:1000,
          system:"你是求职AI助手，帮助求职者处理求职事务：解析JD、面试准备、简历优化等。用中文回答，专业友好。",
          messages:newMessages.slice(-10).map(m => ({ role:m.role, content:m.content })) }) });
      const data = await res.json();
      if (data.content?.[0]?.text) {
        setMessages(prev => [...prev, { id:Date.now(), role:"assistant", content:data.content[0].text }]);
      } else {
        // 把实际错误信息显示出来，方便排查
        const errMsg = data.error || (data.type==="error" && data.error?.message) || JSON.stringify(data);
        setMessages(prev => [...prev, { id:Date.now(), role:"assistant", content:`⚠️ API错误：${errMsg}` }]);
      }
    } catch(e) { setMessages(prev => [...prev, { id:Date.now(), role:"assistant", content:`网络错误：${e.message} 😢` }]); }
    setLoading(false);
  };
  return (
    <div style={{ height:"100vh", background:"#f8fafc", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"#fff", padding:"20px 16px 14px", boxShadow:"0 1px 0 #f0f0f0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BackBtn onClick={() => setPage("dashboard")} />
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ClaudeIcon size={22} active={true} />
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:0, fontSize:17, fontWeight:800 }}>AI求职助手</h1>
            <p style={{ margin:0, fontSize:12, color:"#22c55e", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />在线
            </p>
          </div>
          <Badge style={{ background:"#eff6ff", color:"#3b82f6" }}>Claude</Badge>
        </div>
      </div>
      <div ref={messagesRef} style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12, paddingBottom:90 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"82%", padding:"12px 16px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?"#3b82f6":"#fff", color:m.role==="user"?"#fff":"#1e293b", fontSize:14, lineHeight:1.6, boxShadow:m.role==="assistant"?"0 1px 8px rgba(0,0,0,.06)":"none", whiteSpace:"pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", justifyContent:"flex-start" }}>
            <div style={{ padding:"12px 16px", borderRadius:"18px 18px 18px 4px", background:"#fff", boxShadow:"0 1px 8px rgba(0,0,0,.06)", display:"flex", gap:4, alignItems:"center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#94a3b8", animation:"bounce .6s infinite", animationDelay:`${i*.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ background:"#fff", borderTop:"1px solid #f0f0f0", padding:"12px 16px 24px", display:"flex", gap:10, flexShrink:0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&!e.shiftKey&&send()} placeholder="发送消息..." style={{ flex:1, background:"#f1f5f9", border:"none", borderRadius:20, padding:"10px 16px", fontSize:14, outline:"none" }} />
        <button onClick={send} disabled={loading||!input.trim()} style={{ width:42, height:42, borderRadius:"50%", background:input.trim()?"#3b82f6":"#e2e8f0", border:"none", cursor:input.trim()?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon d={icons.send} size={18} color={input.trim()?"#fff":"#94a3b8"} />
        </button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </div>
  );
};

// ─── Settings ──────────────────────────────────────────────────────────────────
const Settings = ({ setPage }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [mailCfg, saveMailCfg, cfgReady]  = useStoredData(MAIL_CONFIG_KEY, null);

  const clearAll = async () => {
    if (window.confirm("确定要清空所有数据吗？此操作不可撤销")) {
      await Promise.all([db.del("apps"), db.del("todos"), db.del("reviews"), db.del(MAIL_CONFIG_KEY), db.del(PROCESSED_IDS_KEY)]);
      alert("数据已清空，刷新页面后生效");
    }
  };
  const unbindMail = async () => {
    if (window.confirm("确认解绑邮箱？")) { await saveMailCfg(null); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", paddingBottom:80 }}>
      <div style={{ background:"#fff", padding:"20px 16px 14px", boxShadow:"0 1px 0 #f0f0f0" }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:800 }}>设置</h1>
      </div>
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <Card style={{ background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff" }}>张</div>
            <div style={{ color:"#fff" }}>
              <p style={{ margin:0, fontWeight:800, fontSize:17 }}>张三</p>
              <p style={{ margin:"4px 0 0", opacity:.8, fontSize:13 }}>求职者</p>
            </div>
          </div>
        </Card>

        {/* 邮箱绑定状态卡片 */}
        <Card style={{ overflow:"hidden" }}>
          <div style={{ padding:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background: cfgReady && mailCfg?.email ? "#f0fdf4" : "#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon d={icons.mail} size={18} color={cfgReady && mailCfg?.email ? "#16a34a" : "#94a3b8"} />
              </div>
              <div>
                <p style={{ margin:0, fontWeight:600, fontSize:15 }}>邮箱绑定</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>
                  {cfgReady && mailCfg?.email ? `${mailCfg.provider} · ${mailCfg.email}` : "未绑定"}
                </p>
              </div>
            </div>
            {cfgReady && mailCfg?.email
              ? <button onClick={unbindMail} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>解绑</button>
              : <button onClick={() => setPage("mailSync")} style={{ fontSize:12, color:"#3b82f6", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>去绑定</button>
            }
          </div>
        </Card>

        <Card style={{ overflow:"hidden" }}>
          {[{label:"消息通知",sub:"接收面试提醒",val:notifications,set:setNotifications},{label:"深色模式",sub:"暗色主题",val:darkMode,set:setDarkMode}].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:16, borderBottom:i===0?"1px solid #f0f0f0":"none" }}>
              <div><p style={{ margin:0,fontWeight:600,fontSize:15 }}>{item.label}</p><p style={{ margin:"2px 0 0",fontSize:12,color:"#94a3b8" }}>{item.sub}</p></div>
              <div onClick={() => item.set(v=>!v)} style={{ width:44,height:26,borderRadius:13,background:item.val?"#3b82f6":"#e2e8f0",cursor:"pointer",position:"relative",transition:"background .2s" }}>
                <div style={{ width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:item.val?21:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ overflow:"hidden" }}>
          {[["导出数据","下载所有记录"],["导入数据","从文件恢复"]].map(([label,sub],i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,borderBottom:"1px solid #f0f0f0",cursor:"pointer" }}>
              <div><p style={{ margin:0,fontWeight:600,fontSize:15 }}>{label}</p><p style={{ margin:"2px 0 0",fontSize:12,color:"#94a3b8" }}>{sub}</p></div>
              <Icon d={icons.chevronRight} size={16} color="#94a3b8" />
            </div>
          ))}
          <div onClick={clearAll} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,cursor:"pointer" }}>
            <div><p style={{ margin:0,fontWeight:600,fontSize:15,color:"#ef4444" }}>清空数据</p><p style={{ margin:"2px 0 0",fontSize:12,color:"#94a3b8" }}>删除所有记录</p></div>
            <Icon d={icons.trash} size={16} color="#ef4444" />
          </div>
        </Card>
        <p style={{ textAlign:"center",color:"#94a3b8",fontSize:12 }}>求职追踪 v1.2 · T1 邮件同步已上线</p>
      </div>
    </div>
  );
};

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("dashboard");
  const [detailId, setDetailId] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  const renderPage = () => {
    switch (page) {
      case "dashboard":    return <Dashboard setPage={setPage} setDetailId={setDetailId} />;
      case "applications": return <Applications setPage={setPage} setDetailId={setDetailId} />;
      case "appDetail":    return <AppDetail id={detailId} setPage={setPage} />;
      case "addApp":       return <AddApplication setPage={setPage} />;
      case "todos":        return <Todos setPage={setPage} />;
      case "calendar":     return <CalendarView />;
      case "review":       return <Review setPage={setPage} setReviewId={setReviewId} />;
      case "reviewDetail": return <ReviewDetail id={reviewId} setPage={setPage} />;
      case "reviewNew":    return <ReviewNew setPage={setPage} />;
      case "ai":           return <AIAgent setPage={setPage} />;
      case "mailSync":     return <MailSync setPage={setPage} />;
      case "settings":     return <Settings setPage={setPage} />;
      default:             return <Dashboard setPage={setPage} setDetailId={setDetailId} />;
    }
  };

  const showNav = !["ai"].includes(page);
  const navPage = ["applications","appDetail","addApp","todos"].includes(page) ? "dashboard"
    : ["reviewDetail","reviewNew"].includes(page) ? "review"
    : page;

  return (
    <div style={{ maxWidth:430, margin:"0 auto", position:"relative", fontFamily:"'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif", minHeight:"100vh" }}>
      {renderPage()}
      {showNav && <BottomNav page={navPage} setPage={setPage} />}
    </div>
  );
}
