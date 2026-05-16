import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";
import Providers from "@/components/Providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smartfood",
  description: "Smart calorie tracking, naturally",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

// Runs synchronously before first paint.
// Sets ALL CSS vars as inline styles on <html> — highest CSS priority, nothing overrides them.
// suppressHydrationWarning prevents React from reverting the JS-set attributes during hydration.
const ANTI_FOUC = `(function(){
  try{
    var t=localStorage.getItem('smartfood_theme')==='light'?'light':'dark';
    var el=document.documentElement;
    el.setAttribute('data-theme',t);
    var d={'--sf-bg-deep':'#050505','--sf-bg':'#0a0a0a','--sf-surface':'#141414','--sf-surface2':'#111111','--sf-surface3':'#0d0d0d','--sf-input':'#1c1c1c','--sf-pill':'#1e1e1e','--sf-border':'#1a1a1a','--sf-border2':'#252525','--sf-text1':'#ffffff','--sf-text2':'#cccccc','--sf-text3':'#888888','--sf-text4':'#666666','--sf-text5':'#555555','--sf-text6':'#444444','--sf-text7':'#333333','--sf-text8':'#2a2a2a','--sf-shadow':'rgba(0,0,0,0.5)','--sf-overlay':'rgba(0,0,0,0.75)'};
    var l={'--sf-bg-deep':'#e0e0e3','--sf-bg':'#f0f0f2','--sf-surface':'#ffffff','--sf-surface2':'#f4f4f6','--sf-surface3':'#f8f8fa','--sf-input':'#ebebed','--sf-pill':'#e5e5e8','--sf-border':'#e0e0e3','--sf-border2':'#d0d0d4','--sf-text1':'#0a0a0a','--sf-text2':'#2a2a2a','--sf-text3':'#606060','--sf-text4':'#808080','--sf-text5':'#909090','--sf-text6':'#a0a0a0','--sf-text7':'#b8b8b8','--sf-text8':'#cacaca','--sf-shadow':'rgba(0,0,0,0.08)','--sf-overlay':'rgba(0,0,0,0.5)'};
    var v=t==='dark'?d:l;
    for(var k in v)el.style.setProperty(k,v[k]);
  }catch(e){}
})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC }} />
      </head>
      <body
        className="antialiased"
        style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--sf-bg-deep)" }}
      >
        <div
          className="mx-auto flex w-full max-w-[430px] flex-col shadow-2xl"
          style={{ height: "100dvh", backgroundColor: "var(--sf-bg)" }}
        >
          <Providers>
            <NavWrapper>{children}</NavWrapper>
          </Providers>
        </div>
      </body>
    </html>
  );
}
