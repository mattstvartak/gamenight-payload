import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  LucideIcon,
  Settings2,
  SquareLibrary,
} from "lucide-react";

import { NavLibraries } from "@/components/nav-libraries";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavFriends } from "./nav-friends";
import Image from "next/image";
import { NavCalendar } from "./nav-calendar";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";

const payload = await getPayload({ config });

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export async function AppSidebar(props: AppSidebarProps) {
  const { user } = await payload.auth({ headers: await nextHeaders() });

  const data = {
    teams: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Libraries",
        url: "#",
        icon: SquareLibrary,
        isActive: true,
        items:
          user?.libraries
            ?.map((lib) => {
              const library = lib.library;
              if (!library || typeof library === "number") return null;
              return {
                title: library.name || "Untitled Library",
                url: `/library/${library.id}`,
              };
            })
            .filter(
              (item): item is { title: string; url: string } => item !== null
            ) || [],
      },
      {
        title: "Models",
        url: "#",
        icon: Bot,
        items: [
          {
            title: "Genesis",
            url: "#",
          },
          {
            title: "Explorer",
            url: "#",
          },
          {
            title: "Quantum",
            url: "#",
          },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
    ],
    projects:
      user?.libraries
        ?.map((lib) => {
          const library = lib.library;
          if (!library || typeof library === "number") return null;
          return {
            name: library.name || "Untitled Library",
            url: `/library/${library.id}`,
            icon: SquareLibrary,
          };
        })
        .filter(
          (item): item is { name: string; url: string; icon: LucideIcon } =>
            item !== null
        ) || [],
  };

  console.log(user);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-start gap-4 pt-1 px-2 whitespace-nowrap overflow-hidden">
          <Image src="/images/favicon.png" alt="logo" width={32} height={32} />
          <div className="text-2xl font-semibold">Game Night</div>
        </div>
      </SidebarHeader>
      <SidebarContent className="no-scrollbar">
        {user && (
          <>
            <SidebarSeparator className="mx-0" />
            <NavCalendar />
            <SidebarSeparator className="mx-0 hide-on-collapsed" />
            {/* <NavMain items={data.navMain} />
        <SidebarSeparator className="mx-0" /> */}
            <NavLibraries items={data.projects} userId={user.id} />
            <SidebarSeparator className="mx-0" />
            <NavFriends items={data.projects} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? null} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
