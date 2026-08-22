import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw } from 'lucide-react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizPlayerProps {
  quiz: { questions: QuizQuestion[] };
  onClose: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const isAnswered = selectedOption !== null;

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    if (index === currentQuestion.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant max-w-2xl mx-auto w-full text-center">
        <h2 className="font-display-lg text-4xl font-bold text-primary mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold mb-6 text-on-surface">
          {score} / {quiz.questions.length}
        </div>
        <p className="text-on-surface-variant font-body-lg mb-8">
          {score === quiz.questions.length ? 'Perfect score! You have mastered this topic.' : 'Keep reviewing the material to strengthen your understanding.'}
        </p>
        <button onClick={onClose} className="bg-primary text-on-primary px-8 py-3 rounded-full font-button-text hover:brightness-110 transition-all flex items-center gap-2 mx-auto">
          <RefreshCcw className="w-5 h-5" /> Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-outline-variant max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <span className="font-label-caps text-on-surface-variant uppercase tracking-widest">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
        <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-caps">
          Score: {score}
        </span>
      </div>
      
      <h3 className="font-headline-md text-xl font-semibold mb-6 text-on-surface">
        {currentQuestion.question}
      </h3>

      <div className="flex flex-col gap-3 mb-6">
        {currentQuestion.options.map((opt, i) => {
          let stateClass = "bg-surface hover:bg-surface-container-high border-outline-variant/30";
          if (isAnswered) {
            if (i === currentQuestion.correctIndex) {
              stateClass = "bg-electric-lime/20 border-electric-lime text-on-surface ring-2 ring-electric-lime";
            } else if (i === selectedOption) {
              stateClass = "bg-error-container border-error-container text-on-error-container";
            } else {
              stateClass = "bg-surface opacity-50 border-outline-variant/30";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`text-left p-4 rounded-xl border transition-all ${stateClass} flex justify-between items-center`}
            >
              <span className="font-body-md">{opt}</span>
              {isAnswered && i === currentQuestion.correctIndex && <CheckCircle2 className="w-5 h-5 text-secondary" />}
              {isAnswered && i === selectedOption && i !== currentQuestion.correctIndex && <XCircle className="w-5 h-5 text-error" />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/50 mb-6">
            <h4 className="font-label-caps text-primary uppercase mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Explanation
            </h4>
            <p className="font-body-md text-on-surface-variant">
              {currentQuestion.explanation}
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-button-text flex items-center gap-2 hover:brightness-110 transition-all"
            >
              {currentIndex < quiz.questions.length - 1 ? 'Next Question' : 'View Results'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
