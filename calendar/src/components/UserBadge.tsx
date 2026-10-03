interface User {
  id: number
  email: string
  name: string
  calendar_pro_enabled: boolean
}

export default function UserBadge({ user }: { user: User }) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-astro-purple to-astro-blue flex items-center justify-center text-lg font-bold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="font-semibold">{user.name}</div>
        <div className="text-sm text-white/60 flex items-center gap-2">
          {user.email}
          {user.calendar_pro_enabled && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-astro-purple to-astro-blue text-xs font-semibold">
              PRO
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
