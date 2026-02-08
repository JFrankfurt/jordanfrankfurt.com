import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'

interface TrainingLayoutProps {
  children: ReactNode
  title?: string
}

export default function TrainingLayout({
  children,
  title = 'Training',
}: TrainingLayoutProps) {
  return (
    <>
      <Head>
        <title>{title} | Jordan Frankfurt</title>
        <meta name="description" content="Training calendar optimizer" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Training</h1>
            <Link href="/" className="text-sm text-gray-500 hover:text-black">
              ← jordanfrankfurt.com
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto flex">
          <aside className="hidden md:block w-64 border-r border-gray-200 min-h-[calc(100vh-57px)] p-4">
            <nav className="space-y-2">
              <Link
                href="/training"
                className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700"
              >
                Calendar
              </Link>
              <Link
                href="/training/settings"
                className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700"
              >
                Settings
              </Link>
            </nav>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">Quick Stats</p>
            </div>
          </aside>

          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around z-50">
            <Link href="/training" className="text-center py-2 px-4">
              Calendar
            </Link>
            <Link href="/training/settings" className="text-center py-2 px-4">
              Settings
            </Link>
          </div>

          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        </div>
      </div>
    </>
  )
}
