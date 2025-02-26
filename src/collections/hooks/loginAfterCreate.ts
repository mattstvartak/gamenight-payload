import type { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreate: CollectionAfterChangeHook = async ({
    doc,
    operation,
    req,
    req: { payload },
  }) => {
    if (operation === 'create') {
      // Use the doc's email and password directly
      const { email, password } = doc;

      if (email && password) {
        const { token, user } = await payload.login({
          collection: 'users',
          data: { email, password },
          req,
        });

        return {
          ...doc,
          token,
          user,
        }
      }
    }

    return doc
  }