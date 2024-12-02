"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/createSupabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { USFlag } from "@/components/logos";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AxiomSquareLogo } from "@/components/logos";
import Link from "next/link";
import { LuExternalLink, LuAlertCircle } from "react-icons/lu";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type ErrorMessage = {
  error_title: string;
  error_message: string;
  disabled_features: string[];
  error_destructive: boolean;
};

type ErrorMessages = {
  [key: string]: ErrorMessage;
};

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState("Sign In");
  useEffect(() => {
    setButtonText(authMode === "signup" ? "Sign Up" : "Sign In");
  }, [authMode]);
  const [loginImage, setLoginImage] = useState<string | null>(null);
  const [loginImageCopyright, setLoginImageCopyright] = useState<string | null>(
    null
  );
  const [loginImageExplanation, setLoginImageExplanation] = useState<
    string | null
  >(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signupStatus, setSignupStatus] = useState<boolean | null>(false);
  const [signinStatus, setSigninStatus] = useState<boolean | null>(false);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertDescription, setAlertDescription] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkUserSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking session:", error.message);
      } else if (data.session) {
        setIsLoggedIn(true);
        setTimeout(() => {
          const lastVisitedPage =
            localStorage.getItem("lastVisitedPage") || "/";
          router.push(lastVisitedPage);
        }, 1000);
      }
    }

    checkUserSession();

    async function fetchLoginImage() {
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${process.env.NEXT_PUBLIC_NASA_API_KEY}`
      );
      const nasaData = await response.json();

      if (nasaData) {
        setLoginImage(nasaData.url);
        setLoginImageCopyright("NASA");
        setLoginImageExplanation(nasaData.explanation);
        setQuoteOfTheDay(nasaData.title);
        setIsImageLoading(false);
      }
    }

    fetchLoginImage();
  }, [router]);

  const fetchErrors = async () => {
    const { data, error } = await supabase
      .from("axiomSiteSettings")
      .select("error_messages");

    if (error) {
      console.error("Error fetching errors:", error.message);
      setSignupStatus(false);
      setSigninStatus(false);
      setAlertTitle("The database is not responding");
      setAlertDescription(
        "This could be due to an internet connection error or a server problem, please try again."
      );
    } else if (data && data.length > 0) {
      const errors: ErrorMessages = data[0]?.error_messages;

      if (errors && typeof errors === "object") {
        let isSignupDisabled = false;
        let isLoginDisabled = false;

        Object.values(errors).forEach((err) => {
          if (err.disabled_features?.includes("signup")) {
            isSignupDisabled = true;
          }
          if (err.disabled_features?.includes("signin")) {
            isLoginDisabled = true;
          }

          if (err.error_destructive) {
            setAlertTitle(err.error_title);
            setAlertDescription(err.error_message);
          }
        });

        // Update states based on collected information
        setSignupStatus(!isSignupDisabled);
        setSigninStatus(!isLoginDisabled);
      } else {
        console.error("Unexpected error_messages format:", errors);
      }
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const handleAuth = async () => {
    setIsLoading(true);
    setButtonText("Sending request to database");

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setButtonText("Login successful, redirecting...");
        const lastVisitedPage = localStorage.getItem("lastVisitedPage") || "/";
        router.push(lastVisitedPage);
      } else if (authMode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (signUpError) {
          throw signUpError;
        } else {
          const session = await supabase.auth.getSession();
          const userId = session.data?.session?.user?.id || "";

          // Poll to check if the row exists
          const maxRetries = 10; // Number of attempts to check for the row
          let retries = 0;
          let rowExists = false;

          while (retries < maxRetries) {
            const { data, error } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("id", userId)
              .single();

            if (data) {
              rowExists = true;
              break;
            }

            if (error && error.code !== "PGRST116") {
              // If the error is not "Row not found", throw it
              throw error;
            }

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries++;
          }

          if (!rowExists) {
            throw new Error("User profile creation failed or took too long.");
          }

          // Update the user profile with username and role
          const { error: updateError } = await supabase
            .from("user_profiles")
            .update({
              username: username,
              role: role,
            })
            .eq("id", userId);

          if (updateError) {
            throw updateError;
          }

          setButtonText("Account created, redirecting...");
          const lastVisitedPage =
            localStorage.getItem("lastVisitedPage") || "/";
          router.push(lastVisitedPage);
        }
      }
    } catch (error: unknown) {
      setIsLoading(false);
      setButtonText(authMode === "login" ? "Sign In" : "Sign Up");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col lg:flex-row h-full w-full overflow-hidden"
    >
      {/* Left Image Section */}
      <div className="relative hidden lg:block lg:w-1/2 p-1 bg-whtie dark:bg-neutral-950">
        {isImageLoading && <Skeleton className="w-full h-full rounded-3xl" />}
        {!isImageLoading && loginImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full h-full"
            style={{ position: "relative" }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <Image
                  src={loginImage}
                  alt="Background Image"
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                  quality={100}
                  className="rounded-3xl z-10"
                />
                <div className="absolute bottom-5 left-5 z-20 flex flex-col pointer-events-none bg-white/20 backdrop-blur p-3 rounded-lg">
                  <p className="text-4xl text-black kings-regular">AXIOM</p>
                  <p className="text-black text-lg">{quoteOfTheDay}</p>
                </div>
                <div className="absolute bottom-5 right-5 z-20 bg-white/20 backdrop-blur p-2 rounded-full">
                  <AlertDialog>
                    <AlertDialogTrigger className="w-full h-full">
                      ?
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{quoteOfTheDay}</AlertDialogTitle>
                        <AlertDialogDescription>
                          <p>{loginImageExplanation}</p>
                          <p className="mt-2">Source: NASA</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Link
                    href={loginImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    View Original Image
                    <LuExternalLink className="ml-2" />
                  </Link>
                </ContextMenuItem>
                <p className="text-xs text-gray-500 text-center my-2">
                  Image by {loginImageCopyright}
                </p>
              </ContextMenuContent>
            </ContextMenu>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col justify-between px-6 sm:px-12 lg:w-1/2 h-full bg-white dark:bg-neutral-950 text-black dark:text-white">
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-8 flex flex-col justify-center items-center gap-5 relative"
        >
          {/* Logo and Flag Section */}
          <div className="flex items-center justify-center h-full w-full relative">
            <AxiomSquareLogo className="h-5 w-auto" />
            <div className="w-[1px] h-full bg-black dark:bg-white mx-5" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <USFlag className="h-8 w-auto" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>&lt;3 from Wyoming, USA</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Alert Section */}
            {alertTitle && alertDescription && (
              <Alert
                variant={
                  alertTitle === "The database is not responding"
                    ? "default"
                    : "destructive"
                }
                className="absolute top-full mt-2 flex flex-col"
              >
                <LuAlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">{alertTitle}</AlertTitle>
                <AlertDescription>{alertDescription}</AlertDescription>
              </Alert>
            )}
          </div>
        </motion.div>

        {/* Form in the Center or Logged-in Message */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md mx-auto bg-transparent p-8"
        >
          {isLoggedIn ? (
            <div className="text-center text-xl">
              Already logged in, redirecting...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {authMode === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-center mb-8">
                    Welcome Back
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAuth();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className={`w-full ${
                        isLoading || !signupStatus
                          ? "bg-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={isLoading || !signinStatus}
                    >
                      <motion.div
                        key={buttonText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                      >
                        {buttonText}
                      </motion.div>
                    </Button>
                  </form>
                </motion.div>
              )}

              {authMode === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-center mb-8">
                    Create Account
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAuth();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="researcher">Researcher</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className={`w-full ${
                        isLoading || !signupStatus
                          ? "bg-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={isLoading || !signinStatus}
                    >
                      <motion.div
                        key={buttonText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                      >
                        {buttonText}
                      </motion.div>
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Footer */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <p>
              {authMode === "login" ? (
                <>
                  Don’t have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className={`text-blue-500 hover:underline ${
                      !signupStatus
                        ? "text-gray-400 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                    disabled={!signupStatus}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`text-blue-500 hover:underline ${
                      !signinStatus
                        ? "text-gray-400 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                    disabled={!signinStatus}
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
