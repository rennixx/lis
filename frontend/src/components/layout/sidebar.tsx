import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { NAVIGATION_ITEMS } from '@/utils/constants'
import {
  LayoutDashboard,
  Users,
  Beaker,
  ClipboardCheck,
  FileText,
  TestTube,
  Calendar,
  UserCog,
  Menu,
  ClipboardList,
  Package,
  LogOut,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'users': Users,
  'flask': Beaker,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'vial': TestTube,
  'calendar': Calendar,
  'user-cog': UserCog,
  'clipboard-list': ClipboardList,
  'package': Package,
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const filteredNavItems = NAVIGATION_ITEMS.filter(item =>
    item.roles.includes((user?.role as any) || 'admin')
  )

  return (
    <div className={cn(
      "border-r bg-background transition-all duration-300 flex flex-col h-screen",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header Section */}
      <div className="flex h-16 items-center justify-between px-4 border-b flex-shrink-0">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">LIS</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Fixed User Section at Bottom */}
      {user && (
        <div className="border-t p-4 space-y-2 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.full_name || user.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role || 'User'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={logout}
            className={cn(
              "w-full",
              !isCollapsed && "justify-start"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      )}
    </div>
  )
}