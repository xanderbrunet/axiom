"use client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HandleLogout, getUserInfo, getUserInfoFromProfiles } from "@/lib/functions";
import React, { useEffect, useState, useRef } from "react";
import { LuChevronDown } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export const AxiomTopRightDropdown = () => {
    const [email, setEmail] = useState<string | null>("");
    const [name, setName] = useState<string | null>("");
    const [userName, setUserName] = useState<string | null>("");
    const [userPfp, setUserPfp] = useState<string | null>("");
    const [showText, setShowText] = useState(true);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Get user info
        getUserInfo("email").then((email) => setEmail(email ?? ""));
        getUserInfoFromProfiles("name").then((name) => setName(name ?? ""));
        getUserInfoFromProfiles("username").then((username) => setUserName(username ?? ""));
        getUserInfoFromProfiles("pfp").then((pfp) => setUserPfp(pfp ?? ""));

        // Set a delay to start fading out text smoothly after 5 seconds
        const timer = setTimeout(() => {
            setShowText(false);
        }, 5000);

        return () => clearTimeout(timer); // Clean up timer if component unmounts
    }, []);

    return (
        <div className="fixed top-3 right-3 z-40">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        ref={buttonRef}
                        className="flex items-center p-2 overflow-hidden bg-neutral-100 dark:bg-neutral-900 rounded-md"
                        initial={{ width: "auto" }}
                        animate={{
                            width: showText ? "auto" : "fit-content",
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeInOut",
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {showText && (
                                <motion.span
                                    key="name-text"
                                    className="mr-2 overflow-hidden whitespace-nowrap"
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, display: "none" }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                >
                                    Hello, {name}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <motion.div
                            layout
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="flex items-center"
                        >
                            <Avatar className="w-7 h-auto mr-1">
                                <AvatarImage src={userPfp || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} />
                                <AvatarFallback>{name ? `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`.toUpperCase() : ""}</AvatarFallback>
                            </Avatar>
                            <LuChevronDown />
                        </motion.div>
                    </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="">
                    <DropdownMenuLabel>{email}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="" />
                    <DropdownMenuItem><Link href={`/user/${userName}`} className="w-full h-full">Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem className="p-0">
                        <button
                            onClick={HandleLogout}
                            className="w-full h-full px-2 py-2 rounded-sm transition-colors text-start hover:bg-red-500 hover:text-white"
                        >
                            Logout
                        </button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
