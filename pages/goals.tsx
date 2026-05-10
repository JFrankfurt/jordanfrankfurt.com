import Layout from 'components/Layout'
import { sections } from 'data/goals'

/**
 * HSL spectrum for proximity to goal.
 * Rescales so a serious-trainee floor is visible:
 *   progress ≤ 0.4  → red   (hsl 0)
 *   progress = 0.7  → amber (hsl 65)
 *   progress = 1.0  → green (hsl 130)
 */
function progressStyle(progress: number | undefined) {
  if (progress == null) return undefined
  const FLOOR = 0.4
  const visual = Math.max(0, Math.min(1, (progress - FLOOR) / (1 - FLOOR)))
  const hue = Math.round(visual * 130)
  return {
    backgroundColor: `hsl(${hue}, 78%, 92%)`,
    color: `hsl(${hue}, 60%, 26%)`,
  }
}

export default function Goals() {
  return (
    <Layout title="Goals" description="Personal performance scoreboard.">
      <div className="w-full max-w-[800px] px-2 py-6">
        <h1 className="m-0 text-3xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          <span className="font-medium text-gray-900">Training thesis:</span>{' '}
          build transferable capacity across the qualities that decide physical
          contests — skill, strength, speed, endurance, precision, and
          durability. The goal is not to maximize any single sport metric, but
          to become broadly hard to control, hard to exhaust, hard to injure,
          and hard to out-execute under pressure.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          The scoreboard favors combat sports, practical shooting, repeat-effort
          conditioning, heavy strength, short-to-middle distance running, loaded
          movement, and resilience. A goal earns its place by improving one of
          four things: the ability to <em>impose force</em>,{' '}
          <em>resist force</em>, <em>recover between efforts</em>, or{' '}
          <em>perform accurately under stress</em>.
        </p>

        <section
          aria-label="Run-n-gun bottleneck"
          className="mt-6 rounded border border-red-200 bg-red-50 p-4"
        >
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-red-900">
            Run-n-gun bottleneck
          </h2>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-sm tabular-nums">
            <div>
              <dt className="text-xs text-red-900/70">Overall</dt>
              <dd className="font-semibold text-red-900">62/96</dd>
            </div>
            <div>
              <dt className="text-xs text-red-900/70">Run</dt>
              <dd className="font-semibold text-red-900">27/96</dd>
            </div>
            <div>
              <dt className="text-xs text-red-900/70">Shooting</dt>
              <dd className="font-semibold text-red-900">91/96</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-red-900/90">
            Run capacity is the strength; shooting under match conditions is the
            limiter. Hold top-30 run, move shooting to mid-pack.
          </p>
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            aria-label={section.title}
            className="mt-8"
          >
            <h2 className="m-0 text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.description && (
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {section.description}
              </p>
            )}

            <div className="mt-3 hidden md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-2 font-medium">Domain</th>
                    <th className="py-2 pr-2 font-medium">Current</th>
                    <th className="py-2 pr-2 font-medium">Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((g) => {
                    const muted = g.status === 'Untested'
                    const tint = progressStyle(g.progress)
                    return (
                      <tr
                        key={g.domain}
                        className={`border-b border-gray-100 align-top ${muted ? 'text-gray-400' : ''}`}
                      >
                        <td
                          className={`py-2 pr-2 font-medium ${muted ? '' : 'text-gray-900'}`}
                        >
                          {g.domain}
                        </td>
                        <td
                          className={`px-2 py-2 tabular-nums ${tint ? 'rounded font-medium' : muted ? '' : 'text-gray-700'}`}
                          style={tint}
                        >
                          {g.current}
                        </td>
                        <td
                          className={`py-2 pl-2 pr-2 tabular-nums ${muted ? '' : 'text-gray-700'}`}
                        >
                          {g.goal}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="mt-3 space-y-2 md:hidden">
              {section.rows.map((g) => {
                const muted = g.status === 'Untested'
                const tint = progressStyle(g.progress)
                return (
                  <li
                    key={g.domain}
                    className={`rounded border p-3 text-sm ${muted ? 'border-gray-100 text-gray-400' : 'border-gray-200'}`}
                  >
                    <span
                      className={`font-medium ${muted ? '' : 'text-gray-900'}`}
                    >
                      {g.domain}
                    </span>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs tabular-nums">
                      <dt className={muted ? '' : 'text-gray-500'}>Current</dt>
                      <dd
                        className={
                          tint
                            ? 'inline-block rounded px-1.5 font-medium'
                            : muted
                              ? ''
                              : 'text-gray-800'
                        }
                        style={tint}
                      >
                        {g.current}
                      </dd>
                      <dt className={muted ? '' : 'text-gray-500'}>Goal</dt>
                      <dd className={muted ? '' : 'text-gray-800'}>{g.goal}</dd>
                    </dl>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  )
}
