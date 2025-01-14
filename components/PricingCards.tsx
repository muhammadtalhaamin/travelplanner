import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Basic",
    price: "$4.99",
    credits: "100",
    features: ["Profile review", "Quick responses", "24/7 availability"],
  },
  {
    name: "Premium",
    price: "$9.99",
    credits: "300",
    features: [
      "Priority support",
      "Advanced assistance",
      "Detailed explanations",
      "Multiple file analysis",
    ],
  },
];

const PricingCards = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">
          Get the Most out of our AI Agent
        </h2>
        <p className="text-black/60">
          Choose a plan to keep your conversations going
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="p-6 flex flex-col border-black/10 hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold text-black mb-2 dark:text-white">
              {plan.name}
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-black dark:text-white">
                {plan.price}
              </span>
              <span className="text-black/60 dark:text-white/60"> /month</span>
            </div>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              {plan.credits} credits included
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-black dark:text-white" />
                  <span className="text-black dark:text-white">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-black text-white hover:bg-black/90"
              onClick={() => {
                toast.info("Redirecting to checkout page");
              }}
            >
              Get Started
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingCards;
