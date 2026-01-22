import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';

interface MainLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ChatbotWidget />
    </div>
  );
}
