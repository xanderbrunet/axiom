import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { AxiomSquareLogo } from "@/components/logos";
import Link from "next/link";
import { 
  LuLayoutDashboard,
  LuNewspaper,
} from "react-icons/lu";
import { ModeToggle } from "@/components/theme-switch";

export default function AxiomSidebar() {
  return (
    <Sidebar className="z-50">
      <SidebarHeader className="justify-start p-3 flex flex-row items-center">
        <AxiomSquareLogo className="h-6 w-fit" />
        <p className="text-2xl font-bold stopmotion-regular mt-[2px]">AXIOM</p>
        <div className="absolute right-3">
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>You</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="dashboard">
                <SidebarMenuButton asChild>
                  <Link href={"/"}>
                    <LuLayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="yourproj">
                <SidebarMenuButton asChild>
                  <Link href={"/projects"}>
                    <LuNewspaper />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="" />
    </Sidebar>
  );
}
