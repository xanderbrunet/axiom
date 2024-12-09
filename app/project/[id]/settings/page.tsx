"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LuPlus } from "react-icons/lu";
import { supabase } from "@/lib/createSupabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@radix-ui/react-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useAutosave } from "../proj-autosave";

const ProjectSettings = () => {
  const params = useParams();
  const id = params.id;
  const { setAutosaveMessage, setAutosaveLoading } = useAutosave();

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) {
      setAutosaveLoading(false);
      setAutosaveMessage("Autosave is ready");
    }
  }, [loading, setAutosaveLoading, setAutosaveMessage]);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    project_cover: "",
    visibility: "private",
  });

  interface UserProfile {
    id: string;
    name: string;
    username: string;
    pfp_link: string;
  }

  interface ProjectContributor {
    role: string;
    user_profiles: UserProfile;
  }

  interface ProjectData {
    title: string;
    description: string;
    project_cover: string;
    visibility: string;
    project_contributors: ProjectContributor[];
  }

  interface Contributor {
    user_id: string;
    role: string;
    user_profiles: UserProfile;
  }

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // State variables for new contributor
  const [newContributorUsername, setNewContributorUsername] = useState("");
  const [newContributorRole, setNewContributorRole] = useState("");

  // State variables for user search
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchResult, setUserSearchResult] = useState<UserProfile | null>(
    null
  );
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  // State for AlertDialog
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch project data and contributors with user profiles in one query
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            `title, description, project_cover, visibility, 
            project_contributors!fk_project_id(role, user_profiles(id, name, username, pfp_link))`
          )
          .eq("id", id)
          .single();

        if (projectError) {
          console.error("Error fetching project data:", projectError);
          toast.toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch project data.",
          });
          return;
        } else if (projectData) {
          // Type assertion
          const typedProjectData = projectData as unknown as ProjectData;

          setProjectData({
            title: typedProjectData.title,
            description: typedProjectData.description,
            project_cover: typedProjectData.project_cover,
            visibility: typedProjectData.visibility,
          });

          const formattedContributors: Contributor[] =
            typedProjectData.project_contributors.map((contributor) => ({
              user_id: contributor.user_profiles.id,
              role: contributor.role,
              user_profiles: {
                id: contributor.user_profiles.id,
                name: contributor.user_profiles.name || "Unknown",
                username: contributor.user_profiles.username || "",
                pfp_link: contributor.user_profiles.pfp_link || "",
              },
            }));
          setContributors(formattedContributors);
        }
      } catch (error) {
        console.error(
          "Unexpected error fetching project data or contributors:",
          error
        );
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handle autosave
  const handleInputChange = (field: string, value: string) => {
    // Update project data immediately
    setProjectData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  
    // Set loader and saving message immediately
    setAutosaveLoading(true);
    setAutosaveMessage("Saving changes...");
  
    // Clear previous timeout if any
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
  
    // Set a new timeout for saving changes
    setAutosaveTimeout(
      setTimeout(() => {
        saveChanges({ [field]: value });
      }, 3000)
    );
  };
  
  // Save changes to the database (only update the changed fields)
  const saveChanges = async (updatedFields: Partial<typeof projectData>) => {
    const validFields = ["title", "description", "project_cover", "visibility"];
    const filteredFields = Object.keys(updatedFields)
      .filter((key) => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key as keyof typeof projectData] =
          updatedFields[key as keyof typeof projectData];
        return obj;
      }, {} as Partial<typeof projectData>);
  
    if (Object.keys(filteredFields).length === 0) {
      console.log("No changes to save.");
      // Reset loader and message if there are no changes
      setAutosaveLoading(false);
      setAutosaveMessage("Autosave is enabled");
      return;
    }
  
    try {
      const { error } = await supabase
        .from("projects")
        .update(filteredFields)
        .eq("id", id);
  
      if (error) {
        console.error("Error saving changes:", error);
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save changes. Please try again.",
        });
      } else {
        toast.toast({
          variant: "default",
          title: "Success",
          description: "Changes saved successfully.",
        });
      }
  
      // Reset loader and set autosave success message
      setAutosaveLoading(false);
      setAutosaveMessage("All changes saved.");
    } catch (error) {
      console.error("Unexpected error saving changes:", error);
      toast.toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
  
      // Reset loader and set error message
      setAutosaveLoading(false);
      setAutosaveMessage("Autosave is enabled");
    }
  };  

  // Handle role update for a contributor
  const updateContributorRole = async (contributorId: string, role: string) => {
    try {
      // Use the update_contributor_role function
      const { error } = await supabase.rpc("update_contributor_role", {
        p_project_id: id,
        p_user_id: contributorId,
        p_role: role,
      });

      if (error) {
        console.error("Error updating contributor role:", error);
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update contributor role.",
        });
      } else {
        toast.toast({
          variant: "default",
          title: "Success",
          description: "Contributor role updated successfully.",
        });
        setContributors((prevContributors) =>
          prevContributors.map((contributor) =>
            contributor.user_id === contributorId
              ? { ...contributor, role }
              : contributor
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error updating contributor role:", error);
      toast.toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  // Handle adding a new collaborator
  const addCollaborator = async () => {
    try {
      // Use the existing userSearchResult to avoid extra query
      const userProfile = userSearchResult;

      if (!userProfile) {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "User not found. Please enter a valid username.",
        });
        return;
      }

      const userId = userProfile.id;
      if (userId === (await supabase.auth.getSession()).data.session?.user?.id) {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "You cannot add yourself as a collaborator.",
        });
        return;
      }

      // Check if the user is already a collaborator
      if (contributors.some((contributor) => contributor.user_id === userId)) {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "User is already a collaborator.",
        });
        return;
      }

      // Use the add_contributor function
      const { error: collaboratorError } = await supabase.rpc(
        "add_contributor",
        {
          p_project_id: id,
          p_user_id: userId,
          p_role: newContributorRole,
        }
      );

      if (collaboratorError) {
        console.error("Error adding collaborator:", collaboratorError);
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: collaboratorError.code === "P0001"
        ? "You do not have permission to add a collaborator."
        : "Failed to add collaborator.",
        action: collaboratorError.code === "P0001" ? <ToastAction altText="Request">Request</ToastAction> : undefined,
        });
      } else {
        toast.toast({
          variant: "default",
          title: "Success",
          description: "Collaborator added successfully.",
        });
        setContributors((prevContributors) => [
          ...prevContributors,
          {
            user_id: userId,
            role: newContributorRole,
            user_profiles: userProfile,
          },
        ]);
        // Reset the input fields
        setNewContributorUsername("");
        setNewContributorRole("");
        setUserSearchResult(null);
        setIsAlertDialogOpen(false);
      }
    } catch (error) {
      console.error("Unexpected error adding collaborator:", error);
      toast.toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  // Remove a contributor from the project
  const removeContributor = async (contributorId: string) => {
    try {
      // Use the remove_contributor function
      const { error } = await supabase.rpc("remove_contributor", {
        p_project_id: id,
        p_user_id: contributorId,
      });

      if (error) {
        console.error("Error removing contributor:", error);
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove contributor.",
        });
      } else {
        toast.toast({
          variant: "default",
          title: "Success",
          description: "Contributor removed successfully.",
        });
        // Update the local state to reflect the deletion
        setContributors((prevContributors) =>
          prevContributors.filter(
            (contributor) => contributor.user_id !== contributorId
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error removing contributor:", error);
      toast.toast({
        variant: "destructive",
        title: "Error",
        description:
          "An unexpected error occurred while removing the contributor.",
      });
    }
  };

  // Function to search for a user by username with debounce
  const searchUserByUsername = useCallback(
    async (username: string) => {
      setUserSearchLoading(true);
      try {
        const { data: userProfile, error } = await supabase
          .from("user_profiles")
          .select("id, name, username, pfp_link")
          .eq("username", username)
          .single();

        if (error || !userProfile) {
          setUserSearchResult(null);
          setUserSearchError("User not found.");
        } else {
          setUserSearchResult(userProfile);
          setUserSearchError(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserSearchResult(null);
        setUserSearchError("An error occurred.");
      } finally {
        setUserSearchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (newContributorUsername.trim() === "") {
      setUserSearchResult(null);
      setUserSearchError(null);
      return;
    }

    const handler = setTimeout(() => {
      searchUserByUsername(newContributorUsername.trim());
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [newContributorUsername, searchUserByUsername]);

  return (
    <div className="w-full min-h-full flex flex-col py-6 px-4 sm:py-10 sm:px-20">
      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
          {/* Skeleton for Project Information Section */}
          <div className="w-full h-fit flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <div className="flex flex-col gap-y-6 w-full sm:w-2/5">
              <div className="grid w-full items-center gap-1.5">
                <Skeleton className="h-6 w-1/4 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid w-full gap-1.5">
                <Skeleton className="h-6 w-1/4 mb-1" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Skeleton className="h-6 w-1/4 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
          <Separator className="my-6 sm:my-10" />
          {/* Skeleton for Project Privacy Section */}
          <div className="w-full h-fit flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <div className="flex flex-col gap-y-6 w-full sm:w-2/5">
              <div className="grid w-full items-center gap-1.5">
                <Skeleton className="h-6 w-1/4 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Skeleton className="h-6 w-1/4 mb-1" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
            </div>
          </div>
          </motion.div>
      ) : (
        <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
          {/* Project Information */}
          <div className="w-full h-fit flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
            <h1 className="text-2xl font-semibold">Project Information</h1>
            <div className="flex flex-col gap-y-6 w-full sm:w-2/5">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="ProjName">Project Name</Label>
                <Input
                  type="text"
                  id="ProjName"
                  value={projectData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Project Name"
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="ProjDesc">Project Description</Label>
                <Textarea
                  id="ProjDesc"
                  value={projectData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Project Description"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="ProjCover">Project Cover Image</Label>
                <Input
                  type="url"
                  id="ProjCover"
                  value={projectData.project_cover}
                  onChange={(e) =>
                    handleInputChange("project_cover", e.target.value)
                  }
                  placeholder="Project Cover URL"
                />
              </div>
            </div>
          </div>
          <Separator className="my-6 sm:my-10" />
          {/* Project Privacy and Collaboration */}
          <div className="w-full h-fit flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
            <h1 className="text-2xl font-semibold">Project Privacy</h1>
            <div className="flex flex-col gap-y-6 w-full sm:w-2/5">
              <div className="grid w-full items-center gap-1.5">
                <p className="text-sm font-semibold">Project Members</p>
                <div className="flex flex-wrap gap-2">
                  {contributors.map((contributor) => (
                    <Dialog key={contributor.user_id}>
                      <DialogTrigger>
                        <Button variant="ghost" className="h-fit">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={contributor.user_profiles.pfp_link || ""}
                            />
                            <AvatarFallback>
                              {contributor.user_profiles.name
                                ? contributor.user_profiles.name.charAt(0)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          {contributor.user_profiles.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Edit {contributor.user_profiles.name}&apos;s Permission
                          </DialogTitle>
                          <DialogDescription>
                            Change the role of this contributor or remove them
                            from the project.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center gap-3">
                          <Select
                            value={contributor.role} // Pre-populate the role
                            onValueChange={(value) => {
                              if (value === "delete") {
                                // If "Remove" is selected, delete the contributor from the project
                                removeContributor(contributor.user_id);
                              } else {
                                // Update the role using the stored procedure
                                updateContributorRole(
                                  contributor.user_id,
                                  value
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="collaborator">
                                Collaborator
                              </SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="delete">Remove</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}

                  <Dialog>
                    <DialogTrigger>
                      <Button className="h-fit" variant={"secondary"}>
                        <LuPlus className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a Project Member</DialogTitle>
                        <DialogDescription>
                          Add a user to the project and assign their role.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            id="ProjMember"
                            placeholder="Enter a username"
                            className="rounded-md w-full"
                            value={newContributorUsername}
                            onChange={(e) =>
                              setNewContributorUsername(e.target.value)
                            }
                          />
                          <Select
                            value={newContributorRole}
                            onValueChange={(value) =>
                              setNewContributorRole(value)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="collaborator">
                                Collaborator
                              </SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {userSearchLoading ? (
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        ) : userSearchResult ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={userSearchResult.pfp_link || ""}
                              />
                              <AvatarFallback>
                                {userSearchResult.name
                                  ? userSearchResult.name.charAt(0)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">
                                {userSearchResult.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                @{userSearchResult.username}
                              </p>
                            </div>
                          </div>
                        ) : userSearchError ? (
                          <p className="text-sm text-red-500">
                            {userSearchError}
                          </p>
                        ) : null}

                        {/* AlertDialog for confirmation */}
                        <AlertDialog open={isAlertDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="mt-2"
                              onClick={() => {
                                if (
                                  newContributorUsername.trim() &&
                                  newContributorRole &&
                                  userSearchResult
                                ) {
                                  setIsAlertDialogOpen(true);
                                } else {
                                  toast.toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description:
                                      "Please enter a valid username and select a role.",
                                  });
                                }
                              }}
                            >
                              Add
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirm Adding Collaborator
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                You are about to add{" "}
                                {userSearchResult?.name || "this user"} as a{" "}
                                {newContributorRole}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <CardContent>
                            <Card className="my-4 flex items-center gap-3 p-3">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage
                                    src={userSearchResult?.pfp_link || ""}
                                  />
                                  <AvatarFallback>
                                    {userSearchResult?.name
                                      ? userSearchResult.name.charAt(0)
                                      : "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-lg font-semibold">
                                    {userSearchResult?.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    @{userSearchResult?.username}
                                  </p>
                                </div>
                            </Card>
                            </CardContent>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setIsAlertDialogOpen(false)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  addCollaborator();
                                }}
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            </div>
            </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectSettings;