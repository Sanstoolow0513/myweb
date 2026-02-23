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
    <main className="site-page home-page particle-bg">
      <div className="shell">
        <section className="hero-section">
          <span className="hero-kicker stagger-rise-1">./sanstoolow</span>
          <h1 className="hero-title stagger-rise-2">Sanstoolow 小站</h1>
          <p className="hero-subtitle stagger-rise-3">
            在这里记录构建过程，也保留日常创作入口。Blog 用来沉淀内容，Workspace 用来快速起草与整理。
          </p>
          <div className="hero-actions stagger-rise-4">
            <Link className="btn btn-primary" href="/blog">
              进入 Blog →
            </Link>
            <Link className="btn btn-secondary" href="/workspace">
              打开 Workspace
            </Link>
          </div>
        </section>

        <section>
          <div className="entries-grid" aria-label="Site entries">
            {ENTRIES.map((entry, index) => (
              <article
                key={entry.title}
                className="entry-card stagger-rise-2"
                data-index={`0${index + 1}`}
              >
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
                <Link className="btn btn-secondary" href={entry.href}>
                  {entry.action}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="updates-section stagger-rise-3">
          <div className="updates-header">
            <h2>近期动态</h2>
            <p>先把结构和写作节奏稳定下来，后续再逐步扩展文章详情与内容分类。</p>
          </div>

          <div className="updates-list">
            {UPDATES.map((item, index) => (
              <div
                key={`${item.date}-${item.text}`}
                className="update-item stagger-rise-3"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="update-date">{item.date}</span>
                <span className="update-text">{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
