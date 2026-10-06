export type SecretRunner = (
  command: string,
  args: string[],
  options: { input: string; env: NodeJS.ProcessEnv; timeoutMs: number }
) => void

export interface RotateSecretOptions {
  env: NodeJS.ProcessEnv
  run: SecretRunner
}

export function rotateRefreshTokenSecret(
  newToken: string,
  { env, run }: RotateSecretOptions
): void {
  if (!env.GITHUB_ACTIONS) {
    console.log('Not in GitHub Actions — skipping secret rotation')
    return
  }
  if (!env.GH_PAT) {
    throw new Error('GH_PAT is required to rotate STRAVA_REFRESH_TOKEN')
  }

  // Printing the token to the log would expose it, so mask it first.
  console.log(`::add-mask::${newToken}`)

  const args = ['secret', 'set', 'STRAVA_REFRESH_TOKEN']
  if (env.GITHUB_REPOSITORY) args.push('--repo', env.GITHUB_REPOSITORY)

  try {
    run('gh', args, {
      input: newToken,
      env: { ...env, GH_TOKEN: env.GH_PAT },
      timeoutMs: 30_000,
    })
  } catch {
    throw new Error(
      'Failed to rotate STRAVA_REFRESH_TOKEN secret — check GH_PAT permissions'
    )
  }
  console.log('Rotated STRAVA_REFRESH_TOKEN secret')
}
