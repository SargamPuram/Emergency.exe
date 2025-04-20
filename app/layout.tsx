import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Emergency.exe',
  description: 'A* Path finding game',
  generator: 'SargamPuram',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
