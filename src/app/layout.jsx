import "./globals.css";

export const metadata = {
  title: "中小企业 AI 经营助理",
  description: "销售跟单、经营摘要和客户提醒 Web MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
