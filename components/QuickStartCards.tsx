import React from "react";
import { Plane, Hotel, Car, Map, Compass, Mountain, Globe } from "lucide-react";

interface QuickStartCardsProps {
  onQuestionSelect: (question: string) => void;
}

interface TravelQuestion {
  icon: React.ReactNode;
  title: string;
  description: string;
  question: string;
}

const QuickStartCards: React.FC<QuickStartCardsProps> = ({ onQuestionSelect }) => {
  const travelQuestions: TravelQuestion[] = [
    {
      icon: <Plane className="w-6 h-6" />,
      title: "City Break",
      description: "Perfect for short getaways",
      question: "I'd like to plan a weekend city break. My preferred destination is [city] and I'll be traveling for [number of days].",
    },
    {
      icon: <Hotel className="w-6 h-6" />,
      title: "Beach Vacation",
      description: "Relax by the ocean",
      question: "I want to plan a beach vacation for [number of people] people. We're looking to travel to [destination] for [duration].",
    },
    {
      icon: <Mountain className="w-6 h-6" />,
      title: "Adventure Trip",
      description: "For thrill-seekers",
      question: "I'm interested in planning an adventure trip to [destination]. I'd like to include activities like hiking and outdoor sports.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "World Tour",
      description: "Multi-city adventures",
      question: "I want to plan a multi-city tour across [region/countries] for [duration]. My budget is approximately [amount].",
    },
    {
      icon: <Hotel className="w-6 h-6" />,
      title: "Luxury Escape",
      description: "Premium travel experiences",
      question: "I'm looking to plan a luxury vacation in [destination] for [duration]. I'm interested in 5-star accommodations and exclusive experiences.",
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Cultural Experience",
      description: "Immersive local traditions",
      question: "I want to experience the local culture in [destination]. Please suggest cultural activities and authentic experiences for a [duration] trip.",
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Road Trip",
      description: "Journey through scenic routes",
      question: "I'd like to plan a road trip from [start] to [end], stopping at interesting locations along the way. The trip will be about [duration].",
    },
    {
      icon: <Map className="w-6 h-6" />,
      title: "Custom Trip",
      description: "Your unique journey",
      question: "I want to plan a custom trip to [destination] for [duration]. My interests include [activities/preferences] and my budget is [amount].",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full p-4">
      {travelQuestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onQuestionSelect(item.question)}
          className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
        >
          <div className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
            {item.icon}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickStartCards;