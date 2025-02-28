"use client";

import {
  Eye,
  Forward,
  MoreHorizontal,
  Plus,
  SquareLibrary,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LibraryDialog } from "./library-dialog";
import qs from "qs";
export function NavLibraries({
  items,
  userId,
}: {
  items: {
    title: string;
    url: string;
    id: string;
  }[];
  userId: number;
}) {
  const { isMobile } = useSidebar();

  const deleteLibrary = async (libraryId: string) => {
    const query = qs.stringify(
      {
        where: {
          id: {
            equals: libraryId,
          },
        },
      },
      { addQueryPrefix: true }
    );

    try {
      const res = await fetch(`/api/library/${query}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        console.log("Library deleted");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Game Libraries</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <a href={item.url}>
                <SquareLibrary />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Eye className="text-muted-foreground" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteLibrary(item.id)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <LibraryDialog
            userId={userId}
            trigger={
              <SidebarMenuButton
                className="text-sidebar-foreground/70"
                tooltip="New"
              >
                <Plus className="text-sidebar-foreground/70" />
                <span>New</span>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
