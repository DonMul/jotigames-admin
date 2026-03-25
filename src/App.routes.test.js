import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const appSource = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8')

const expectedRootRoutes = ['/login', '/dashboard/*']
const expectedDashboardChildRoutes = ['index', 'game-modes', 'users', 'users/new', 'users/:userId/edit']

describe('admin route inventory', () => {
  it('contains root routes', () => {
    for (const path of expectedRootRoutes) {
      expect(appSource).toContain(`path=\"${path}\"`)
    }
  })

  it('contains dashboard child routes', () => {
    for (const path of expectedDashboardChildRoutes) {
      if (path === 'index') {
        expect(appSource).toContain('<Route index element=')
      } else {
        expect(appSource).toContain(`path=\"${path}\"`)
      }
    }
  })

  it('contains wildcard redirect route', () => {
    expect(appSource).toContain('path="*"')
  })
})
