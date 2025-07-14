import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your First Protocol",
  description: "Get started by creating your first protocol template",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          {children}
        </div>
      </div>
    </div>
  );
} 