"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

const ProjectSettings = () => {
  const params = useParams();
  const id = params.id;

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    project_cover: "",
    visibility: "private",
  });

  interface UserProfile {
    id: string;
    name: string;
    avatar_url: string;
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("title, description, project_cover, visibility")
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
          setProjectData({
            title: projectData.title,
            description: projectData.description,
            project_cover: projectData.project_cover,
            visibility: projectData.visibility,
          });
        }

        // Fetch contributors
        const { data: contributorsData, error: contributorsError } =
          await supabase
            .from("project_contributors")
            .select("user_id, role")
            .eq("project_id", id);

        if (contributorsError) {
          console.error("Error fetching project contributors:", contributorsError);
          toast.toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch project contributors.",
          });
          return;
        } else if (contributorsData) {
          const userIds = contributorsData.map(
            (contributor) => contributor.user_id
          );

          // Fetch user profiles
          const { data: userProfilesData, error: userProfilesError } =
            await supabase
              .from("user_profiles")
              .select("id, name, pfp_link")
              .in("id", userIds);

          if (userProfilesError) {
            console.error("Error fetching user profiles:", userProfilesError);
            toast.toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to fetch user profiles.",
            });
            return;
          } else if (userProfilesData) {
            const formattedContributors: Contributor[] = contributorsData.map(
              (contributor) => {
                const userProfile = userProfilesData.find(
                  (profile) => profile.id === contributor.user_id
                );

                return {
                  user_id: contributor.user_id,
                  role: contributor.role,
                  user_profiles: {
                    id: userProfile?.id || "",
                    name: userProfile?.name || "Unknown",
                    avatar_url: userProfile?.pfp_link || "",
                  },
                };
              }
            );
            setContributors(formattedContributors);
          }
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
    setProjectData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    setAutosaveTimeout(
      setTimeout(() => {
        saveChanges({ [field]: value });
      }, 3000)
    );
  };

  // Save changes to the database (only update the changed fields)
  const saveChanges = async (updatedFields: Partial<typeof projectData>) => {
    // Ensure `updatedFields` doesn't contain invalid keys like `role`
    const validFields = ["title", "description", "project_cover", "visibility"];
    const filteredFields = Object.keys(updatedFields)
      .filter((key) => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key as keyof typeof projectData] =
          updatedFields[key as keyof typeof projectData];
        return obj;
      }, {} as Partial<typeof projectData>);

    // Only update if we have fields to update
    if (Object.keys(filteredFields).length === 0) {
      console.log("No changes to save.");
      return;
    }
    try {
      console.log("Saving changes:", filteredFields);
      const { error, data } = await supabase
        .from("projects")
        .update(filteredFields)
        .eq("id", id);
      console.log("Data:", data);
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
    } catch (error) {
      console.error("Unexpected error saving changes:", error);
      toast.toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  // Handle role update for a contributor
  const updateContributorRole = async (
    contributorId: string,
    role: string
  ) => {
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
  const addCollaborator = async (username: string, role: string) => {
    try {
      // Fetch user profile by username
      console.log("Adding collaborator with username:", username);
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("id, name, pfp_link")
        .eq("username", username)
        .single();

      if (userProfileError || !userProfile) {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "User not found. Please enter a valid username.",
        });
        return;
      }

      const userId = userProfile.id;

      // Check if the user is already a collaborator
      const { data: existingContributor } = await supabase
        .from("project_contributors")
        .select("user_id")
        .eq("user_id", userId)
        .eq("project_id", id);

      if (existingContributor && existingContributor.length > 0) {
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
          p_role: role,
        }
      );

      if (collaboratorError) {
        console.error("Error adding collaborator:", collaboratorError);
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add collaborator.",
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
            role,
            user_profiles: {
              id: userId,
              name: userProfile.name,
              avatar_url: userProfile.pfp_link || "",
            },
          },
        ]);
        // Reset the input fields
        setNewContributorUsername("");
        setNewContributorRole("");
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
        description: "An unexpected error occurred while removing the contributor.",
      });
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col py-6 px-4 sm:py-10 sm:px-20">
      {loading ? (
        <>
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
        </>
      ) : (
        <>
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
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Project Description"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="ProjCover">Project Cover Image</Label>
                <Input
                  type="url"
                  id="ProjCover"
                  value={projectData.project_cover}
                  onChange={(e) => handleInputChange("project_cover", e.target.value)}
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
                              src={contributor.user_profiles.avatar_url || ""}
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
                            Change the role of this contributor or remove them from the
                            project.
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
                                updateContributorRole(contributor.user_id, value);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="collaborator">Collaborator</SelectItem>
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
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          id="ProjMember"
                          placeholder="Enter a username"
                          className="rounded-md"
                          value={newContributorUsername}
                          onChange={(e) => setNewContributorUsername(e.target.value)}
                        />
                        <Select
                          value={newContributorRole}
                          onValueChange={(value) => setNewContributorRole(value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="collaborator">Collaborator</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          className="ml-4"
                          onClick={() => {
                            const username = newContributorUsername.trim();
                            const role = newContributorRole;
                            if (username && role) {
                              addCollaborator(username, role);
                            } else {
                              toast.toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Please enter a username and select a role.",
                              });
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSettings;
