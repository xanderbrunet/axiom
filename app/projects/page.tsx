"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    LuPlus,
    LuTrash,
    LuFileSymlink,
} from "react-icons/lu";
import { supabase } from "@/lib/createSupabaseClient";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const ProjectsPage = () => {
    interface Project {
        id: string;
        title: string;
        description: string;
        updated_at: string;
        project_cover: string;
    }
    const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
    const [collaborativeProjects, setCollaborativeProjects] = useState<Project[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [projName, setProjName] = useState("");
    const [createButtonStatus, setCreateButtonStatus] = useState("Create Project");
    const [deleteButtonStatus, setDeleteButtonStatus] = useState("Delete");
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);

            try {
                const { data: session } = await supabase.auth.getSession();

                if (!session?.session?.user?.id) {
                    console.error("User not logged in");
                    return;
                }

                const userId = session.session.user.id;

                // Fetch owned projects
                const { data: owned, error: ownedError } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("user_id", userId);

                if (ownedError) {
                    console.error("Error fetching owned projects:", ownedError);
                } else {
                    setOwnedProjects(owned || []);
                }

                // Fetch collaborative projects
                const { data: collaborative, error: collaborativeError } =
                    await supabase
                        .from("project_contributors")
                        .select("project_id, projects(*)")
                        .eq("user_id", userId);

                if (collaborativeError) {
                    console.error(
                        "Error fetching collaborative projects:",
                        collaborativeError
                    );
                } else {
                    setCollaborativeProjects(
                        collaborative?.map((c) => c.projects).flat() || []
                    );
                }
            } catch (err) {
                console.error("Error fetching projects:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    async function createProject() {
        if (!projName) {
            toast.toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a project name.",
            });
            return;
        }
        setCreateButtonStatus("Creating Project...");
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
            console.error("User not logged in");
            toast.toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in to create a project.",
            });
            setCreateButtonStatus("Create Project");
            return;
        }
        const { data: project, error } = await supabase
            .from("projects")
            .insert([
                {
                    title: projName,
                    user_id: session.session.user.id,
                    visibility: "private",
                },
            ])
            .select("id");
        if (error) {
            console.error("Error creating project:", error);
            toast.toast({
                variant: "destructive",
                title: "Error",
                description:
                    "An error occurred while creating the project. Please try again.",
            });
            setCreateButtonStatus("Create Project");
        }
        if (project) {
            toast.toast({
                variant: "default",
                title: "Success",
                description: "Project created successfully.",
            });
            setCreateButtonStatus("Opening Project...");
            router.push(`/project/${project[0].id}`);
        }
    }

    async function deleteProject(projectId: string) {
        const { error } = await supabase.from("projects").delete().eq("id", projectId);
        if (error) {
            console.error("Error deleting project:", error);
            toast.toast({
                variant: "destructive",
                title: "Error",
                description:
                    "An error occurred while deleting the project. Please try again.",
            });
        } else {
            toast.toast({
                variant: "default",
                title: "Success",
                description: "Project deleted successfully.",
            });
            setOwnedProjects(ownedProjects.filter((p) => p.id !== projectId));
        }
    }

    return (
        <motion.div
            className="flex flex-col w-full min-h-full p-10 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between w-full">
                <p className="text-2xl font-bold">Projects</p>
                <Dialog>
                    <DialogTrigger>
                        <Button>
                            <LuPlus /> Create Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a project</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            You will be the owner of this project and can invite others to
                            collaborate.
                        </DialogDescription>
                        <div className="grid items-center gap-1.5 w-full">
                            <Label htmlFor="projname">Project Name:</Label>
                            <Input
                                type="text"
                                id="projname"
                                placeholder="Project Name"
                                className="w-full"
                                onChange={(e) => setProjName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                onClick={createProject}
                                className={`${createButtonStatus !== "Create Project"
                                        ? "text-gray-400 cursor-not-allowed pointer-events-none"
                                        : ""
                                    }`}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    key={createButtonStatus}
                                >
                                    {createButtonStatus}
                                </motion.div>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <AnimatePresence>
                {loading ? (
                    <motion.div
                        className="mt-6"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xl font-semibold mb-4">Owned Projects</p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <motion.div key={i} layout>
                                    <Skeleton className="h-40" />
                                    <Skeleton className="h-6 mt-2" />
                                    <Skeleton className="h-4 mt-2" />
                                </motion.div>
                            ))}
                        </div>
                        <p className="text-xl font-semibold mt-10 mb-4">
                            Collaborative Projects
                        </p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <motion.div key={i} layout>
                                    <Skeleton className="h-40" />
                                    <Skeleton className="h-6 mt-2" />
                                    <Skeleton className="h-4 mt-2" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Owned Projects Section */}
                        <div className="mt-6">
                            <p className="text-xl font-semibold mb-4">Owned Projects</p>
                            {ownedProjects.length > 0 ? (
                                <motion.div
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {ownedProjects.map((project) => (
                                        <motion.div key={project.id} layout>
                                            <Card className="h-full w-full overflow-hidden relative flex flex-col justify-between">
                                                <Dialog>
                                                    <DialogTrigger className="absolute top-3 right-3 z-40">
                                                        <Button className="bg-transparent text-black dark:text-white shadow-none hover:bg-red-500 hover:text-white w-full h-full p-2 m-0 rounded-md">
                                                            <LuTrash />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Confirm Deletion</DialogTitle>
                                                        </DialogHeader>
                                                        <DialogDescription>
                                                            Are you sure you want to delete this project? This action cannot be undone.
                                                        </DialogDescription>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="secondary">Cancel</Button>
                                                            </DialogClose>
                                                            <Button
                                                                onClick={async () => {
                                                                    setDeleteButtonStatus("Deleting...");
                                                                    await deleteProject(project.id);
                                                                    setDeleteButtonStatus("Delete");
                                                                }}
                                                                variant="destructive"
                                                                className={`${deleteButtonStatus !== "Delete"
                                                                    ? "text-white cursor-not-allowed pointer-events-none"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    key={deleteButtonStatus}
                                                                >
                                                                    {deleteButtonStatus}
                                                                </motion.div>
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                <div className="flex flex-col w-full items-start">
                                                    <div className="relative w-full h-20">
                                                        {project.project_cover ? (
                                                            <Image
                                                                fill={true}
                                                                objectFit="cover"
                                                                src={project.project_cover}
                                                                alt={project.title}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200"></div>
                                                        )}
                                                    </div>

                                                    <CardHeader className="flex-shrink-0">
                                                        <CardTitle>
                                                            {project.title}
                                                        </CardTitle>
                                                    </CardHeader>
                                                </div>

                                                <CardFooter className=" flex-shrink-0 flex flex-col gap-2 items-start">
                                                    <Button className="w-full" onClick={() => router.push(`/project/${project.id}`)}>
                                                        Open Project <LuFileSymlink />
                                                    </Button>
                                                    <p className="text-neutral-500 text-sm">
                                                        Last Updated:{" "}
                                                        {new Date(project.updated_at).toLocaleDateString()}
                                                    </p>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-gray-500">No owned projects found.</p>
                            )}
                        </div>

                        {/* Collaborative Projects Section */}
                        <div className="mt-10">
                            <p className="text-xl font-semibold mb-4">
                                Collaborative Projects
                            </p>
                            {collaborativeProjects.length > 0 ? (
                                <motion.div
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {collaborativeProjects.map((project) => (
                                        <motion.div key={project.id} layout>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{project.title}</CardTitle>
                                                    <CardDescription>
                                                        {project.description}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {/* Additional project info can go here */}
                                                </CardContent>
                                                <CardFooter>
                                                    <p>
                                                        Last Updated:{" "}
                                                        {new Date(project.updated_at).toLocaleDateString()}
                                                    </p>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-gray-500">
                                    No collaborative projects found.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProjectsPage;
