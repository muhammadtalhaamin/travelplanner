import React from "react";
import { Star, Moon, Sun, Calendar, Map } from "lucide-react";

// Define the props interface
interface QuickStartCardsProps {
  onQuestionSelect: (question: string) => void;
}

// Define the question item interface
interface QuestionItem {
  icon: React.ReactNode;
  text: string;
  question: string;
}

const QuickStartCards: React.FC<QuickStartCardsProps> = ({
  onQuestionSelect,
}) => {
  const questions = [
    {
      icon: <Star className="w-5 h-5" />,
      text: "Birth Chart Reading",
      question: "I'd like to get my birth chart reading. My birth date is [please provide your birth date, time, and place].",
    },
    {
      icon: <Moon className="w-5 h-5" />,
      text: "Daily Horoscope",
      question: "What's my horoscope for today? My zodiac sign is [please specify your sign].",
    },
    {
      icon: <Sun className="w-5 h-5" />,
      text: "Numerology Reading",
      question: "Can you provide a numerology reading based on my birth date [please provide your birth date]?",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      text: "Upcoming Transits",
      question: "What are the significant astrological transits coming up for my sign [please specify your sign]?",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full p-4">
      {questions.map((item, index) => (
        <button
          key={index}
          onClick={() => onQuestionSelect(item.question)}
          className="bg-white dark:bg-black p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center space-y-3 border border-black/10 dark:border-white/10"
        >
          <div className="text-black dark:text-white">{item.icon}</div>
          <span className="text-sm text-black dark:text-white">
            {item.text}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickStartCards;
