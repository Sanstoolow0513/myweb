import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "首页 | Markdown Workspace",
  description: "Markdown Workspace 首页，进入 /workspace 即可开始编辑、预览与自动保存。",
};

const FEATURES = [
  {
    title: "即时预览",
    description: "左写右看，Markdown 渲染实时同步，写作节奏不断档。",
  },
  {
    title: "自动保存",
    description: "输入后自动触发保存，必要时也可一键手动保存。",
  },
  {
    title: "本地持久化",
    description: "基于 SQLite 存储文档，刷新或重启后内容依旧保留。",
  },
  {
    title: "移动端可用",
    description: "在手机上可切换编辑与预览视图，保持专注阅读与输入。",
  },
];

const STEPS = [
  "进入 Workspace",
  "新建文档并开始书写",
  "实时预览并自动保存",
];

export default function LandingPage() {
  return (
    <main className="landing-main">
      <section className="landing-hero">
        <div className="landing-shell">
          <p className="landing-kicker">NEXT.JS 16 · MARKDOWN WORKSPACE</p>
          <h1 className="landing-title">把灵感写成结构化文档，随时继续。</h1>
          <p className="landing-subtitle">
            这是一个轻量的 Markdown 工作台：列表管理、双栏编辑预览、自动保存，一次打开就能立即开始。
          </p>

          <div className="landing-actions">
            <Link className="landing-btn landing-btn-primary" href="/workspace">
              进入 Workspace
            </Link>
            <a className="landing-btn landing-btn-secondary" href="#features">
              查看功能
            </a>
          </div>

          <div className="landing-step-row" aria-label="How it works">
            {STEPS.map((step, index) => (
              <div key={step} className="landing-step">
                <span className="landing-step-index">0{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-shell">
          <div className="landing-section-head">
            <h2>常见而顺手的写作工作流</h2>
            <p>你在 Next.js 项目里期待的现代化入口页 + 工具页分离方案，这里已经准备好。</p>
          </div>

          <div className="landing-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="landing-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-cta">
        <div className="landing-shell landing-cta-box">
          <div>
            <h2>准备好就开始写吧</h2>
            <p>从首页进入 /workspace，你的文档会在本地持续保存，适合日常笔记和草稿沉淀。</p>
          </div>
          <Link className="landing-btn landing-btn-primary" href="/workspace">
            打开工作台
          </Link>
        </div>
      </section>
    </main>
  );
}
