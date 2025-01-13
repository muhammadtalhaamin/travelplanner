import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "$4.99",
    credits: "50",
    features: [
      "50 AI conversations",
      "Profile review",
      "Message suggestions",
      "24/7 availability",
    ],
  },
  {
    name: "Premium",
    price: "$9.99",
    credits: "120",
    features: [
      "120 AI conversations",
      "Priority support",
      "Advanced dating strategies",
      "Personalized advice",
      "Unlimited profile reviews",
    ],
  },
];

const PricingCards = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">
          Continue Your Dating Journey
        </h2>
        <p className="text-black/60">
          Choose a plan to keep getting expert dating advice
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="p-6 flex flex-col border-black/10 hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold text-black mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-black">{plan.price}</span>
              <span className="text-black/60"> /month</span>
            </div>
            <p className="text-sm text-black/60 mb-4">
              {plan.credits} credits included
            </p>
            <ul className="space-y-2 mb-6 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-black" />
                  <span className="text-black">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-black text-white hover:bg-black/90"
              onClick={() => window.open("/checkout", "_blank")}
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
