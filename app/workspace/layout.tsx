import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Workspace | Markdown Workspace",
  description: "Markdown 文档工作台，支持文档管理、实时预览与自动保存。",
};

export default function WorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
