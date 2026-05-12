import './globals.css'

export const metadata = {
  title: 'FieldFlow — Client Portal',
  description: 'Document portal for tax preparation clients',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
