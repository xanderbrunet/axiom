import React, { useState, createContext, useContext } from "react";
import { BsCloudCheck } from "react-icons/bs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Oval } from "react-loader-spinner";

const AutosaveContext = createContext<{
  setAutosaveMessage: (message: string) => void;
  setAutosaveLoading: (isLoading: boolean) => void;
} | null>(null);

export const AutosaveProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [autosaveMessage, setAutosaveMessage] = useState("Autosave is starting");
  const [autosaveLoading, setAutosaveLoading] = useState(true);

  return (
    <AutosaveContext.Provider value={{ setAutosaveMessage, setAutosaveLoading }}>
      {children}
      <div className="fixed top-5 right-24 w-fit h-fit text-2xl">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {autosaveLoading ? (
                <Oval
                  color="#000"
                  secondaryColor="#f0f0f0"
                  height={20}
                  width={20}
                  strokeWidth={5}
                />
              ) : (
                <BsCloudCheck />
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{autosaveMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </AutosaveContext.Provider>
  );
};

export const useAutosave = () => {
  const context = useContext(AutosaveContext);
  if (!context) {
    throw new Error("useAutosave must be used within an AutosaveProvider");
  }
  return context;
};
