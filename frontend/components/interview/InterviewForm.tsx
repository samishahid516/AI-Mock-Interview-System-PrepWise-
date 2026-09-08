"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";

interface InterviewFormProps {
  onSubmit: (data: {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  }) => void;
  isLoading?: boolean;
}

const InterviewForm = ({ onSubmit, isLoading }: InterviewFormProps) => {
  const [formData, setFormData] = useState({
    role: "",
    level: "Mid",
    type: "Technical",
    techstack: "",
    amount: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse tech stack (comma-separated)
    const techstack = formData.techstack
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech.length > 0);

    onSubmit({
      role: formData.role,
      level: formData.level,
      type: formData.type,
      techstack: techstack.length > 0 ? techstack : ["General"],
      amount: formData.amount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Job Role *
        </label>
        <input
          type="text"
          required
          placeholder="e.g., Frontend Developer, Backend Developer, Full Stack Developer"
          className="w-full px-4 py-3 rounded-lg bg-dark-400 border border-dark-200 text-white placeholder-gray-500 focus:outline-none focus:border-primary-200 transition"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Experience Level *
          </label>
          <select
            required
            className="w-full px-4 py-3 rounded-lg bg-dark-400 border border-dark-200 text-white focus:outline-none focus:border-primary-200 transition"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          >
            <option value="Junior">Junior</option>
            <option value="Mid">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Interview Type *
          </label>
          <select
            required
            className="w-full px-4 py-3 rounded-lg bg-dark-400 border border-dark-200 text-white focus:outline-none focus:border-primary-200 transition"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tech Stack (comma-separated)
        </label>
        <input
          type="text"
          placeholder="e.g., React, TypeScript, .NET, SQL Server"
          className="w-full px-4 py-3 rounded-lg bg-dark-400 border border-dark-200 text-white placeholder-gray-500 focus:outline-none focus:border-primary-200 transition"
          value={formData.techstack}
          onChange={(e) =>
            setFormData({ ...formData, techstack: e.target.value })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: List technologies relevant to this role
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Number of Questions *
        </label>
        <input
          type="number"
          min="3"
          max="10"
          required
          className="w-full px-4 py-3 rounded-lg bg-dark-400 border border-dark-200 text-white focus:outline-none focus:border-primary-200 transition"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: parseInt(e.target.value) || 5 })
          }
        />
        <p className="text-xs text-gray-500 mt-1">Between 3-10 questions</p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.role}
        className="w-full py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-black font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
      >
        {isLoading ? "Generating Questions..." : "Generate Questions & Start Interview"}
      </Button>
    </form>
  );
};

export default InterviewForm;

