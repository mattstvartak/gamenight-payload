import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentUser } from "@/utils/auth";
import { UserProvider } from "@/contexts/user-context";

export const AppProvider = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = await getCurrentUser();

  return (
    <>
      <UserProvider user={user}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </>
  );
};

export default AppProvider;
