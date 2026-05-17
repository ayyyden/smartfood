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
  metadataBase: new URL("https://smartfood-eight.vercel.app"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Smartfood",
    description: "Smart calorie tracking, naturally",
    url: "https://smartfood-eight.vercel.app",
    siteName: "Smartfood",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Smartfood — Smart calorie tracking, naturally",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smartfood",
    description: "Smart calorie tracking, naturally",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Smartfood",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f2f2f5",
};

// Runs synchronously before first paint.
// Sets ALL CSS vars as inline styles on <html> — highest CSS priority, nothing overrides them.
// suppressHydrationWarning prevents React from reverting the JS-set attributes during hydration.
const ANTI_FOUC = `(function(){
  try{
    var t=localStorage.getItem('smartfood_theme')==='dark'?'dark':'light';
    var el=document.documentElement;
    el.setAttribute('data-theme',t);
    var d={'--sf-bg-deep':'#050505','--sf-bg':'#0a0a0a','--sf-surface':'#141414','--sf-surface2':'#111111','--sf-surface3':'#0d0d0d','--sf-input':'#1c1c1c','--sf-pill':'#1e1e1e','--sf-border':'#1a1a1a','--sf-border2':'#252525','--sf-text1':'#ffffff','--sf-text2':'#cccccc','--sf-text3':'#aaaaaa','--sf-text4':'#888888','--sf-text5':'#787878','--sf-text6':'#686868','--sf-text7':'#565656','--sf-text8':'#3c3c3c','--sf-shadow':'rgba(0,0,0,0.5)','--sf-overlay':'rgba(0,0,0,0.75)'};
    var l={'--sf-bg-deep':'#e8e8ec','--sf-bg':'#f2f2f5','--sf-surface':'#ffffff','--sf-surface2':'#f4f4f6','--sf-surface3':'#f8f8fa','--sf-input':'#ebebed','--sf-pill':'#e5e5e8','--sf-border':'#e0e0e3','--sf-border2':'#d0d0d4','--sf-text1':'#111111','--sf-text2':'#333333','--sf-text3':'#505050','--sf-text4':'#666666','--sf-text5':'#7a7a7a','--sf-text6':'#8e8e8e','--sf-text7':'#b5b5b5','--sf-text8':'#d0d0d0','--sf-shadow':'rgba(0,0,0,0.08)','--sf-overlay':'rgba(0,0,0,0.5)'};
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
    <html lang="en" className={geist.variable} data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
