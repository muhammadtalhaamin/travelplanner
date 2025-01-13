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
  const questions: QuestionItem[] = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      text: "Ask for dating advice",
      question: "Can you give me some dating advice?",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      text: "Get tips for writing a great profile",
      question: "What are some tips for writing an attractive dating profile?",
    },
    {
      icon: <Shirt className="w-5 h-5" />,
      text: "Outfit suggestions for a date",
      question: "What should I wear on a first date?",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      text: "Help crafting messages to matches",
      question: "Can you help me write an engaging first message to my match?",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full p-4">
      {questions.map((item, index) => (
        <button
          key={index}
          onClick={() => onQuestionSelect(item.question)}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center space-y-3 border border-black/10"
        >
          <div className="text-black">{item.icon}</div>
          <span className="text-sm text-black">{item.text}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickStartCards;
