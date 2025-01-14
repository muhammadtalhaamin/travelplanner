import React from "react";
import { MessageCircle, FileText, Shirt, Mail } from "lucide-react";

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
      icon: <MessageCircle className="w-5 h-5" />,
      text: "Get personalized advice",
      question:
        "I'd like some personalized advice about a situation I'm facing.",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      text: "Help with writing and communication",
      question: "Can you help me improve my writing and communication skills?",
    },
    {
      icon: <Shirt className="w-5 h-5" />,
      text: "Professional presentation tips",
      question: "What are some tips for presenting myself professionally?",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      text: "Draft important messages",
      question: "Can you help me write an important message or email?",
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
