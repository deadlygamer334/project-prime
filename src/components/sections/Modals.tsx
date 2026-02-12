"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Modals() {
  // In a real application, these would be controlled by state/context
  // For the purpose of cloning the hidden components, we provide the layout structure
  return (
    <>
      <AddFromListModal isOpen={false} onClose={() => {}} />
      <MoveBlockModal isOpen={false} onClose={() => {}} />
    </>
  );
}

const AddFromListModal = ({ isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      id="addFromListModal"
    >
      <div 
        className="w-full max-w-[500px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0a0a0a] shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-[18px] font-semibold text-white">Add Tasks from List</h3>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div 
            className="mb-6 min-h-[200px] max-h-[400px] overflow-y-auto rounded-lg bg-white/[0.03] p-4 text-center text-white/40"
            id="modalTaskList"
          >
            {/* Task list items would go here */}
            <p className="py-12 text-[14.4px]">Your master to-do list is empty</p>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[14.4px] font-medium text-white transition-all hover:bg-white/10"
            >
              Cancel
            </button>
            <button 
              className="rounded-xl bg-white px-6 py-3 text-[14.4px] font-semibold text-black transition-all hover:bg-white/90"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoveBlockModal = ({ isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null;

  const blocks = [
    { id: "morning", label: "Morning", time: "6:00 – 12:00" },
    { id: "afternoon", label: "Afternoon", time: "12:00 – 16:00" },
    { id: "evening", label: "Evening", time: "16:00 – 20:00" },
    { id: "night", label: "Night", time: "20:00 – 6:00" },
  ];

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md"
      id="moveBlockModal"
    >
      <div 
        className="w-[320px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
      >
        <div className="mb-4 text-[16px] font-semibold text-white">
          Move Task to Block
        </div>
        
        <div className="mb-6 flex flex-col gap-2" id="moveBlockOptions">
          {blocks.map((block) => (
            <button
              key={block.id}
              className="group flex w-full flex-col items-start rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition-all hover:border-white/20 hover:bg-white/10"
            >
              <span className="text-[14px] font-medium text-white group-hover:text-white">
                {block.label}
              </span>
              <span className="text-[12px] text-white/40">
                {block.time}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[14px] font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};