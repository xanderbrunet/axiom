"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LuChevronDown } from "react-icons/lu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useEffect, useState } from "react";
import debounce from "lodash.debounce";
import { supabase } from "@/lib/createSupabaseClient"; // Adjust path as needed
import secureLocalStorage from "react-secure-storage";

interface UserSettings {
    id?: string;
    trd_prefers_notification_ping: boolean;
    trd_prefers_notification_badge: boolean;
    trd_prefers_name_display: boolean;
    trd_prefers_show_email: boolean;
    trd_prefers_user_pfp: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Omit<UserSettings, "id">>({
        trd_prefers_notification_ping: false,
        trd_prefers_notification_badge: false,
        trd_prefers_name_display: false,
        trd_prefers_show_email: false,
        trd_prefers_user_pfp: true,
    });
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState<Record<keyof Omit<UserSettings, "id">, boolean>>({
        trd_prefers_notification_ping: false,
        trd_prefers_notification_badge: false,
        trd_prefers_name_display: false,
        trd_prefers_show_email: false,
        trd_prefers_user_pfp: false,
    });

    // Fetch the user session and user ID
    useEffect(() => {
        const fetchUserId = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching user session:", error);
            } else if (data?.session?.user?.id) {
                setUserId(data.session.user.id);
            }
        };
        fetchUserId();
    }, []);

    // Fetch user settings from Supabase
    useEffect(() => {
        if (!userId) return;

        const fetchUserSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("user_settings")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching user settings:", error);
            } else if (data) {
                setSettings(data);
            }
            console.log(loading);
            setLoading(false);
        };

        fetchUserSettings();
    }, [userId]);

    // Auto-save settings to Supabase with debounce
    const saveSettings = debounce(async (key: keyof UserSettings, value: boolean) => {
        if (!userId) return;

        setSaving((prev) => ({ ...prev, [key]: true }));

        const updatedSettings = { ...settings, [key]: value };
        const { data, error } = await supabase
            .from("user_settings")
            .update(updatedSettings)
            .eq("id", userId)
            .select();

        if (error) {
            console.error("Error saving user settings:", error);
        } else if (data) {
            console.log("Settings saved successfully:", data);
            secureLocalStorage.setItem("user_settings", data);
            setSettings(updatedSettings);
        }

        setSaving((prev) => ({ ...prev, [key]: false }));
    }, 500);

    // Handle changes to settings
    const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
        saveSettings(key, value);
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="account" className="w-full p-3">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                </TabsList>
                <TabsContent value="account">Make changes to your account here.</TabsContent>
                <TabsContent value="appearance" className="w-full pt-5">
                    <div className="w-full h-fit flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
                        <h1 className="text-2xl font-semibold">Appearance Settings</h1>
                        <div className="flex flex-col gap-y-6 w-full sm:w-1/2">
                            {/* Notification Icon */}
                            <div className="grid w-full items-center">
                                <p className="font-semibold">Notification icon</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                    Display a dot on the dropdown when a notification is available.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md relative">
                                        <Avatar className="w-7 h-auto mr-1">
                                            <AvatarImage src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <LuChevronDown />
                                        <span className="absolute top-0 right-0 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 md:mr-2">
                                        <Switch
                                            checked={settings.trd_prefers_notification_badge}
                                            onCheckedChange={(value) =>
                                                handleSettingChange("trd_prefers_notification_badge", value)
                                            }
                                            disabled={saving.trd_prefers_notification_badge}
                                        />
                                        <Label>Enable</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Pulse Notification Icon */}
                            <div className="grid w-full items-center">
                                <p className="font-semibold">Pulse notification icon</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                    Pulse the notification icon when a notification is available.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md relative">
                                        <Avatar className="w-7 h-auto mr-1">
                                            <AvatarImage src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <LuChevronDown />
                                        <span className="absolute top-0 right-0 flex h-2 w-2">
                                            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 md:mr-2">
                                        <Switch
                                            checked={settings.trd_prefers_notification_ping}
                                            onCheckedChange={(value) =>
                                                handleSettingChange("trd_prefers_notification_ping", value)
                                            }
                                            disabled={saving.trd_prefers_notification_ping}
                                        />
                                        <Label>Enable</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Show Name on Load */}
                            <div className="grid w-full items-center">
                                <p className="font-semibold">Show name on load</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                    Show the user&apos;s name on the dropdown on load. Disappears after 5 seconds.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md relative">
                                        <p className="mr-2 overflow-hidden whitespace-nowrap">Hello, Jane Doe</p>
                                        <Avatar className="w-7 h-auto mr-1">
                                            <AvatarImage src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <LuChevronDown />
                                    </div>
                                    <div className="flex items-center gap-2 md:mr-2">
                                        <Switch
                                            checked={settings.trd_prefers_name_display}
                                            onCheckedChange={(value) =>
                                                handleSettingChange("trd_prefers_name_display", value)
                                            }
                                            disabled={saving.trd_prefers_name_display}
                                        />
                                        <Label>Enable</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Show Profile Picture */}
                            <div className="grid w-full items-center">
                                <p className="font-semibold">Show profile picture</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                    Show the user&apos;s profile picture. Disabling will show initials of the user&apos;s first and last name.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md relative">
                                        <Avatar className="w-7 h-auto mr-1">
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <LuChevronDown />
                                    </div>
                                    <div className="flex items-center gap-2 md:mr-2">
                                        <Switch
                                            checked={settings.trd_prefers_user_pfp}
                                            onCheckedChange={(value) =>
                                                handleSettingChange("trd_prefers_user_pfp", value)
                                            }
                                            disabled={saving.trd_prefers_user_pfp}
                                        />
                                        <Label>Enable</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Show Email */}
                            <div className="grid w-full items-center">
                                <p className="font-semibold">Show user email</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                    Show the user&apos;s email within the dropdown.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center p-2 bg-neutral-100 dark:bg-neutral-900 rounded-md relative">
                                        <p className="mr-2 overflow-hidden whitespace-nowrap">jane.doe@axiomwy.com</p>
                                    </div>
                                    <div className="flex items-center gap-2 md:mr-2">
                                        <Switch
                                            checked={settings.trd_prefers_show_email}
                                            onCheckedChange={(value) =>
                                                handleSettingChange("trd_prefers_show_email", value)
                                            }
                                            disabled={saving.trd_prefers_show_email}
                                        />
                                        <Label>Enable</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
