import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentUser } from "@/utils/auth";

export const AppProvider = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = await getCurrentUser();

  return (
    <>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
};
export default AppProvider;
