import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NextInLine',
  description: 'Classroom queue management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }} className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
