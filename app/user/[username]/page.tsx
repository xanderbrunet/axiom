// app/[username]/page.tsx

"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/createSupabaseClient';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { LuPen, LuPlus, LuUserMinus } from 'react-icons/lu';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const ProfilePage = ({ params }: { params: { username: string } }) => {
  const { username }: { username: string } = params;
  type UserProfile = {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    bio: string;
    role: string;
    pfp_link: string;
    bg_link: string;
  };
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>("Other");
  const [editRelation, setEditRelation] = useState<string | null>("Follow");

  const [editName, setEditName] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [editBio, setEditBio] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const sanitizedUsername = username.startsWith('%40') ? username.slice(3) : username;
  
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', sanitizedUsername);
  
        if (userProfileError) {
          setError('User not found');
          setUserData(null);
          setIsLoading(false);
          return;
        }
  
        if (!userProfile || userProfile.length !== 1) {
          setError('User not found or multiple rows returned');
          setUserData(null);
          setIsLoading(false);
          return;
        }
  
        const userProfileData = userProfile[0];
        setUserData(userProfileData);
        setEditBio(userProfileData?.bio || '');
        setEditName(userProfileData?.name || '');
        setEditRole(userProfileData?.role || '');
        setEditUsername(userProfileData?.username || '');
        setRole(userProfileData?.role.charAt(0).toUpperCase() + userProfileData?.role.slice(1));
  
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
        if (sessionError) {
          console.error('Error fetching session data:', sessionError.message);
        } else if (sessionData?.session) {
          const loggedInUserId = sessionData.session.user.id;
  
          if (loggedInUserId === userProfileData.id) {
            setEditRelation('Edit');
          } else {
            const { data: followerData, error: followerError } = await supabase
              .from('user_relations')
              .select('*')
              .eq('follower_id', loggedInUserId)
              .eq('followed_id', userProfileData.id);
  
            if (followerError) {
              console.error('Error fetching follower data:', followerError.message);
            }
            if (followerData && followerData.length > 0) {
              setEditRelation('Unfollow');
            } else {
              setEditRelation('Follow');
            }
          }
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, [username]); // Removed userData dependency
  

  async function handleRelationChange() {
    if (editRelation === 'Follow') {
      setEditRelation('Unfollow');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session data:', sessionError.message);
          setEditRelation('Follow');
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "An error occurred while trying to follow this user. Please try again later.",
          });
          return;
        }

        if (sessionData?.session) {
          const loggedInUserId = sessionData.session.user.id;
          const { data: userProfile, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', username);

          if (userProfileError || !userProfile || userProfile.length !== 1) {
            console.error('Error fetching user profile data or multiple rows returned:', userProfileError?.message);
            setEditRelation('Follow');
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "An error occurred while trying to follow this user. Please try again later.",
            });
            return;
          }

          const userProfileData = userProfile[0];
          const { error: newRelationError } = await supabase
            .from('user_relations')
            .insert([
              {
                follower_id: loggedInUserId,
                followed_id: userProfileData.id,
              },
            ]);

          if (newRelationError) {
            console.error('Error creating new relation:', newRelationError.message);
            setEditRelation('Follow');
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "An error occurred while trying to follow this user. Please try again later.",
            });
            return;
          }
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setEditRelation('Follow');
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "An unexpected error occurred while trying to follow this user. Please try again later.",
        });
      }
    } else if (editRelation === 'Unfollow') {
      setEditRelation('Follow');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session data:', sessionError.message);
          setEditRelation('Unfollow');
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "An error occurred while trying to unfollow this user. Please try again later.",
          });
          return;
        }

        if (sessionData?.session) {
          const loggedInUserId = sessionData.session.user.id;

          const { data: userProfile, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', username);

          if (userProfileError || !userProfile || userProfile.length !== 1) {
            console.error('Error fetching user profile data or multiple rows returned:', userProfileError?.message);
            setEditRelation('Unfollow');
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "An error occurred while trying to unfollow this user. Please try again later.",
            });
            return;
          }

          const userProfileData = userProfile[0];
          const { error: deletedRelationError } = await supabase
            .from('user_relations')
            .delete()
            .eq('follower_id', loggedInUserId)
            .eq('followed_id', userProfileData.id);

          if (deletedRelationError) {
            console.error('Error deleting relation:', deletedRelationError.message);
            setEditRelation('Unfollow');
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "An error occurred while trying to unfollow this user. Please try again later.",
            });
            return;
          }
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setEditRelation('Unfollow');
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "An unexpected error occurred while trying to unfollow this user. Please try again later.",
        });
      }
    }
  }

  async function handleEditProfile() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session data:', sessionError.message);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "An error occurred while trying to edit your profile. Please try again later.",
      });
      return;
    }
    if (sessionData?.session) {
      const loggedInUserId = sessionData.session.user.id;
      if (loggedInUserId === userData?.id) {

        if (!editName) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Your name cannot be empty.",
          });
          return;
        } else if (!editUsername) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Your username cannot be empty.",
          });
          return;
        } else if (!editRole) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Your role cannot be empty.",
          });
          return;
        } else {
          const updatedProfileData = {
            name: editName,
            username: editUsername,
            role: editRole,
            bio: editBio || '',
        };

          const { error: updateProfileError } = await supabase
            .from('user_profiles')
            .update(updatedProfileData)
            .eq('id', loggedInUserId);

          if (updateProfileError) {
            console.error('Error updating profile data:', updateProfileError.message);
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "An error occurred while trying to update your profile. Please try again later.",
            });
            return;
          } else {
            toast({
              variant: "default",
              title: "Success",
              description:
                "Your profile has been updated successfully.",
            });
            location.reload();
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "You do not have permission to edit this profile. How did you get here?",
        });
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col w-full min-h-full">
        {/* Header Section Skeleton */}
        <div className="w-full h-36 animate-pulse dark:bg-gray-600"></div>

        {/* Profile Image and Details Skeleton */}
        <div className="flex flex-col md:flex-row items-center md:items-start text-black dark:text-white md:ml-16">
          <div className='w-28 h-28 md:w-32 md:h-32 mt-[-2rem] rounded-full border-4 border-white dark:border-neutral-900 mx-auto md:mx-0 animate-pulse bg-gray-300 dark:bg-gray-700'></div>
          <div className='flex flex-col items-center md:items-start gap-3 md:ml-5 mt-3'>
            <Skeleton className="w-[150px] h-[30px] rounded-full dark:bg-gray-600" />
            <Skeleton className="w-[100px] h-[20px] rounded-full dark:bg-gray-600" />
          </div>
        </div>

        {/* Bio Section Skeleton */}
        <div className="mt-6 md:mx-16 p-3">
          <Skeleton className='w-[50px] h-[20px] mb-2 dark:bg-gray-600' />
          <Skeleton className='w-full h-[60px] dark:bg-gray-600' />
        </div>

        {/* Publications Section Skeleton */}
        <div className="mt-6 md:mx-16 p-3">
          <Skeleton className='w-[120px] h-[20px] mb-2 dark:bg-gray-600' />
          <Skeleton className='w-full h-[100px] dark:bg-gray-600' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full h-full flex items-center justify-center text-black dark:text-white gap-3'>
        <p className='text-5xl'>:(</p>
        <p>Snap, we could not find this user</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="profile-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col w-full min-h-full"
      >
        <div className="relative w-full h-36">
          <Image 
            src={userData?.bg_link || "https://shop.wallpaperpaintandmorestl.com/cdn/shop/products/454F57_1024x.png?v=1607636420"}
            alt="User Profile Banner" 
            objectFit='cover'
            quality={100}
            fill={true}
          />
        </div>

        {/* Profile Image and Details */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start text-black dark:text-white md:ml-16">
          <div className='w-28 h-28 md:w-32 md:h-32 mt-[-2rem] rounded-full border-4 border-white dark:border-neutral-900 mx-auto md:mx-0'>
            <Image 
              src={userData?.pfp_link || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
              alt={userData?.name || "User Profile Picture"} 
              width={128} 
              height={128} 
              className='rounded-full' 
            />
          </div>
          <div className='flex flex-col items-center md:items-start gap-3 md:ml-5 mt-3'>
            <h1 className='text-2xl md:text-3xl text-center md:text-left'>{userData?.name || 'Jane Doe'}</h1>
            <Badge variant="secondary">{role}</Badge>
          </div>
          <div className='absolute top-0 right-0 p-3'>
            {editRelation === 'Edit' ? (
              <Dialog>
              <DialogTrigger>
                <Button variant="default"><LuPen /><p className='md:block hidden'>Edit Profile</p></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Public Profile</DialogTitle>
                </DialogHeader>
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="name">Name:</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={editName || ""}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Label htmlFor="username">Username:</Label>
                    <div className="flex items-center w-full">
                      <Input
                        disabled
                        type="text"
                        placeholder="axiomwy.com/user/"
                        className="max-w-[150px] pr-0 rounded-tr-none rounded-br-none"
                      />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username"
                        className="rounded-tl-none rounded-bl-none w-full"
                        value={editUsername || ""}
                        onChange={(e) => setEditUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Label htmlFor="role">Role:</Label>
                    <Select
                      value={editRole?.toLowerCase() || "other"}
                      onValueChange={(value) => {
                        setEditRole(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3 md:my-2 mt-2 mb-4">
                    <Label htmlFor="bio">Bio:</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself"
                      value={editBio || ""}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  <DialogFooter className='gap-3'>
                    <DialogClose asChild>
                      <Button variant="destructive" id='closeProfileEdit'>Cancel</Button>
                    </DialogClose>
                    <Button variant="default" onClick={handleEditProfile}>Save</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            ) : (
            <Button variant="default" onClick={() => handleRelationChange()}>
              {editRelation === "Follow" ? (
                <LuPlus />
              ) : editRelation === "Unfollow" ? (
                <LuUserMinus />
              ) : (
                <LuPen />
              )}{" "}
              {editRelation}
            </Button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6 md:mx-16 p-3">
          <p className='text-black dark:text-white text-xl font-bold'>Bio:</p>
          <p className='text-black dark:text-white mt-2'>{userData?.bio || 'This user has not set a bio'}</p>
        </div>

        {/* Publications Section */}
        <div className="mt-6 md:mx-16 p-3">
          <p className='text-black dark:text-white text-xl font-bold'>Publications & Public Projects:</p>
          <p className='text-neutral-600 dark:text-neutral-400 mt-2'>This user has no publications or public projects</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePage;
