import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTraining } from 'contexts/TrainingContext'
import { READINESS_COLORS } from './colors'

export default function Sidebar() {
  const router = useRouter()
  const { state } = useTraining()

  const today = new Date().toISOString().split('T')[0]
  const todayReadiness = state.readinessLogs.find((l) => l.date === today)

  const currentWeek = state.plan?.weeks.find((w) => {
    const start = new Date(w.startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const now = new Date()
    return now >= start && now <= end
  })

  const isActive = (path: string) => router.pathname === path

  return (
    <div className="space-y-6">
      <nav className="space-y-1">
        <Link
          href="/training"
          className={`block px-3 py-2 rounded-md transition-colors ${
            isActive('/training')
              ? 'bg-gray-200 text-black font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Calendar
        </Link>
        <Link
          href="/training/settings"
          className={`block px-3 py-2 rounded-md transition-colors ${
            isActive('/training/settings')
              ? 'bg-gray-200 text-black font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Settings
        </Link>
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Today&apos;s Readiness
        </p>
        {todayReadiness ? (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              READINESS_COLORS[todayReadiness.zone].bgLight
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full ${READINESS_COLORS[todayReadiness.zone].bg}`}
            />
            <span
              className={`text-sm font-medium capitalize ${READINESS_COLORS[todayReadiness.zone].text}`}
            >
              {todayReadiness.zone}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50">
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-500">Not logged</span>
          </div>
        )}
      </div>

      {state.plan && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Plan Status
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Week</span>
              <span className="font-medium">
                {currentWeek
                  ? `${currentWeek.weekNumber} of ${state.plan.weeks.length}`
                  : '—'}
              </span>
            </div>
            {currentWeek && (
              <div className="flex justify-between">
                <span className="text-gray-600">ACWR</span>
                <span
                  className={`font-medium ${
                    currentWeek.acwr >= 0.8 && currentWeek.acwr <= 1.3
                      ? 'text-green-600'
                      : currentWeek.acwr > 1.3
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {currentWeek.acwr.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to blog
        </Link>
      </div>
    </div>
  )
}
