import "@/app/globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Sistema de Ventas NODS",
  description: "Dashboard de ventas y gestión de clientes",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/favicon.ico',
  },
};

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
