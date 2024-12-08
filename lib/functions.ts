import { supabase } from "@/lib/createSupabaseClient";
import  secureLocalStorage from  "react-secure-storage";

export function setLastPageVisited() {
    localStorage.setItem("lastVisitedPage", window.location.pathname);
}

export async function HandleLogout() {
  const { error } = await supabase.auth.signOut();
  localStorage.clear();
  secureLocalStorage.clear();
  deleteAllCookies();
  if (error) {
      console.error("Error logging out:", error);
  } else {
      console.log("User logged out");
      window.location.href = "/auth";
  }
}

// Utility function to delete all cookies
function deleteAllCookies() {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
      const [name] = cookie.split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}


export async function CheckLogin() {
    const user = await supabase.auth.getSession();
    console.log("Checking login");
    console.log(user);
    if (user.data.session == null && location.pathname !== "/auth") {
        console.log("User not logged in");
        window.location.href = "/auth";
    }
}

interface UserProfile {
    id: string;
    name: string;
    username: string;
    pfp_link: string;
  }
  
  export async function getUserInfoFromProfiles(
    info: string,
    refresh: boolean = false
  ): Promise<string | null> {
    // Get the current session user
    const userSession = await supabase.auth.getSession();
    const userId = userSession?.data?.session?.user?.id;
  
    if (!userId) {
      console.error("No user is currently logged in.");
      return null;
    }
  
    let userProfiles = secureLocalStorage.getItem("user_profiles") as UserProfile[] | null;
  
    // Refresh data from the database if requested or if no local data exists
    if (refresh || !userProfiles || userProfiles.length === 0) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select()
        .eq("id", userId);
  
      if (error) {
        console.error("Error fetching user profiles:", error.message);
        return null;
      }
  
      if (data && data.length > 0) {
        userProfiles = data as UserProfile[];
        secureLocalStorage.setItem("user_profiles", userProfiles);
      } else {
        console.error("No matching user profile found.");
        return null;
      }
    }
  
    // Extract and return the requested info
    switch (info) {
      case "name":
        return userProfiles?.[0]?.name || null;
      case "username":
        return userProfiles?.[0]?.username || null;
      case "pfp":
        return userProfiles?.[0]?.pfp_link || null;
      default:
        console.error(`Unsupported info type: ${info}`);
        return null;
    }
  }  

export async function getUserInfo(info: string){
    const user = await supabase.auth.getSession();
    switch (info) {
        case "email":
            return user?.data?.session?.user.email;
        case "name":
            return user?.data?.session?.user.email;
        default:
            return null;
    }
}

export async function fetchAndSaveUserSettings(){
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session:", error.message);
    return;
  }
  const userId = data.session?.user?.id;
  if (userId) {
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select()
      .eq("id", userId);
    if (settingsError) {
      console.error("Error fetching user settings:", settingsError.message);
      return;
    }
    if (userSettings && userSettings.length > 0) {
      secureLocalStorage.setItem("user_settings", userSettings);
    }
  }
}

export async function getUserSettings(refresh: boolean = false) {
  let userSettings = secureLocalStorage.getItem("user_settings") as UserProfile[] | null;

  if (refresh || !userSettings || userSettings.length === 0) {
    await fetchAndSaveUserSettings();
    userSettings = secureLocalStorage.getItem("user_settings") as UserProfile[] | null;
  }

  return userSettings && userSettings.length > 0 ? userSettings[0] : null;
}