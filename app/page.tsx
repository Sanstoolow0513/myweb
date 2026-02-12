import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sanstoolow 小站",
  description: "Sanstoolow 的个人主页入口，可前往 Blog 与 Workspace。",
};

const ENTRIES = [
  {
    title: "Blog",
    description: "静态展示页，收纳开发日志、学习笔记与阶段复盘。",
    href: "/blog",
    action: "进入 Blog",
  },
  {
    title: "Workspace",
    description: "双栏 Markdown 工作台，支持自动保存与移动端切换预览。",
    href: "/workspace",
    action: "打开 Workspace",
  },
  {
    title: "Build Notes",
    description: "小站目前使用 Next.js 16 + React 19 + SQLite，先轻量可用，再持续演进。",
    href: "/blog",
    action: "查看记录",
  },
];

const UPDATES = [
  {
    date: "2026-02",
    text: "首页改为小站入口，新增 Blog 静态展示页。",
  },
  {
    date: "2026-01",
    text: "Workspace 支持移动端编辑/预览切换与自动保存。",
  },
  {
    date: "2025-12",
    text: "初版 Markdown 文档管理能力上线。",
  },
];

export default function HomePage() {
  return (
    <main className="site-main">
      <section className="site-hero">
        <div className="site-shell">
          <p className="site-kicker">SANSTOOLOW STATION</p>
          <h1 className="site-title">Sanstoolow 的小站主页</h1>
          <p className="site-subtitle">
            在这里记录构建过程，也保留日常创作入口。Blog 用来沉淀内容，Workspace 用来快速起草与整理。
          </p>

          <div className="site-actions">
            <Link className="site-btn site-btn-primary" href="/blog">
              去看 Blog
            </Link>
            <Link className="site-btn site-btn-secondary" href="/workspace">
              打开 Workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-shell">
          <div className="site-grid" aria-label="Site entries">
            {ENTRIES.map((entry) => (
              <article key={entry.title} className="site-card">
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
                <Link className="site-card-link" href={entry.href}>
                  {entry.action}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section-compact">
        <div className="site-shell">
          <div className="site-section-head">
            <h2>近期动态</h2>
            <p>先把结构和写作节奏稳定下来，后续再逐步扩展文章详情与内容分类。</p>
          </div>

          <ul className="site-update-list">
            {UPDATES.map((item) => (
              <li key={`${item.date}-${item.text}`} className="site-update-item">
                <span className="site-update-date">{item.date}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
