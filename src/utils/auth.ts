import { User } from "../payload-types";

export const isAdminOrCreatedBy = ({
  req: { user },
}: {
  req: { user: User | null };
}) => {
  // Scenario #1 - Check if user has the 'admin' role
  if (user?.roles?.includes('admin')) {
    return true;
  }

  // Scenario #2 - Allow only documents with the current user set to the 'createdBy' field
  if (user) {
    // Will return access for only documents that were created by the current user
    return {
      createdBy: {
        equals: user.id,
      },
    };
  }

  // Scenario #3 - Disallow all others
  return false;
};
