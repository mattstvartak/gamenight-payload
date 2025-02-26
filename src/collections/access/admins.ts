import type { Access } from 'payload'

import { checkRole } from './checkRole'

export const admins: Access = ({ req: { user } }) => user ? checkRole(['admin'], user) : false