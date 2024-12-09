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
import { getUserSettings } from "@/lib/functions";

export const AxiomTopRightDropdown = () => {
    const [email, setEmail] = useState<string | null>("");
    const [name, setName] = useState<string | null>("");
    const [userName, setUserName] = useState<string | null>("");
    const [userPfp, setUserPfp] = useState<string | null>("");
    const [showText, setShowText] = useState(true);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [notificationPing, setNotificationPing] = useState(false);
    const [enableNotificationPing, setEnableNotificationPing] = useState(false);
    const [prefersNameDisplay, setPrefersNameDisplay] = useState(false);
    const [prefersShowEmail, setPrefersShowEmail] = useState(false);
    const [prefersShowPfp, setPrefersShowPfp] = useState(false);

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

    useEffect(() => {
        const fetchUserSettings = async () => {
            const user_settings = await getUserSettings();
            console.log(user_settings);
            if (user_settings && typeof user_settings === 'object' && 'trd_prefers_notification_ping' in user_settings) {
                if (user_settings.trd_prefers_notification_ping === true) {
                    setNotificationPing(true);
                }
            }
            if (user_settings && typeof user_settings === 'object' && 'trd_prefers_notification_badge' in user_settings) {
                if (user_settings.trd_prefers_notification_badge === true) {
                    setEnableNotificationPing(true);
                }
            }
            if (user_settings && typeof user_settings === 'object' && 'trd_prefers_name_display' in user_settings) {
                if (user_settings.trd_prefers_name_display === true) {
                    setPrefersNameDisplay(true);
                }
            }
            if (user_settings && typeof user_settings === 'object' && 'trd_prefers_show_email' in user_settings) {
                if (user_settings.trd_prefers_show_email === true) {
                    setPrefersShowEmail(true);
                }
            }
            if (user_settings && typeof user_settings === 'object' && 'trd_prefers_user_pfp' in user_settings) {
                if (user_settings.trd_prefers_user_pfp === true) {
                    setPrefersShowPfp(true);
                }
            }
        };
        fetchUserSettings();
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
                            {showText && prefersNameDisplay && (
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
                                            {prefersShowPfp ? (
                                                <AvatarImage src={userPfp || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} />
                                            ) : (
                                                <AvatarFallback>JD</AvatarFallback>
                                            )}
                            </Avatar>
                            <LuChevronDown />
                            {enableNotificationPing && (
                            <span className="absolute top-0 right-0 flex h-2 w-2">
                                <span className={`${notificationPing ? 'motion-safe:animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-amber-400 dark:bg-amber-600 opacity-75`}></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-600"></span>
                            </span>
                            )}
                        </motion.div>
                    </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="">
                    <DropdownMenuLabel>{prefersShowEmail ? `${email}` : 'Your Account'}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="" />
                    <DropdownMenuItem><Link href={`/user/${userName}`} className="w-full h-full">Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem><Link href={`/settings`} className="w-full h-full">Settings</Link></DropdownMenuItem>
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
