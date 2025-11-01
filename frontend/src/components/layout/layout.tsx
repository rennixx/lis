import { Outlet } from 'react-router-dom'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { FloatingActionMenu } from '@/components/common/FloatingActionMenu'

export function Layout() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full">
          <Header user={null} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Floating Action Menu */}
      <FloatingActionMenu />
    </div>
  )
}