// app/projects/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import { LuChevronDown } from "react-icons/lu";

const ProjNavbar = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [page, setPage] = React.useState("home");

    React.useEffect(() => {
        const path = window.location.pathname.split("/").pop();
        if (path === id || !path) {
            setPage("home");
        } else if (["files", "extensions", "settings"].includes(path)) {
            setPage(path);
        } else {
            setPage("home");
        }
    }, [id]);

    const handleNavigation = (value: string) => {
        setPage(value);
        router.push(`/project/${id}/${value === "home" ? "" : value}`);
    };

    return (
        <div className="w-fit h-fit mt-3 md:ml-3 ml-16 fixed z-30">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-lg py-5">
                        {page.charAt(0).toUpperCase() + page.slice(1)} <LuChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select a Page</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={page} onValueChange={handleNavigation}>
                        <DropdownMenuRadioItem value="home">Home</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="files">Files</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="extensions">
                            Extensions
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="settings">
                            Settings
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default ProjNavbar;
