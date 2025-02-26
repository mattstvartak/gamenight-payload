import type { User } from '@/payload-types'

export const checkRole = (allRoles: ('admin' | 'user')[] = [], user?: User): boolean => {
  if (user) {
    if (allRoles.some(role => user.roles?.includes(role))) {
      return true
    }
  }
  return false
}