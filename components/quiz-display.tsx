'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizDisplayProps {
  quiz: {
    questions: Question[];
  };
}

export default function QuizDisplay({ quiz }: QuizDisplayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [showExplanation, setShowExplanation] = useState(false);

  const question = quiz.questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(false);
  };

  const handleSubmit = () => {
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setShowExplanation(false);
  };

  const correctCount = selectedAnswers.filter(
    (answer, index) => answer === quiz.questions[index].correctAnswer
  ).length;

  const isQuizComplete = selectedAnswers.every((answer) => answer !== null);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          {isQuizComplete && (
            <span className="font-semibold text-green-600">
              Score: {correctCount}/{quiz.questions.length}
            </span>
          )}
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options */}
          <RadioGroup value={selectedAnswer?.toString() ?? ''} onValueChange={(val) => handleSelectAnswer(parseInt(val))}>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-900">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {' '}
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Explanation */}
          {showExplanation && (
            <Alert
              variant={isCorrect ? 'default' : 'destructive'}
              className={isCorrect ? 'bg-green-50 border-green-200' : ''}
            >
              <div className="flex gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-2">
                  <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <AlertDescription className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                    <strong>Explanation:</strong> {question.explanation}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!showExplanation ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="flex-1"
              >
                Submit Answer
              </Button>
            ) : (
              <>
                {currentQuestion > 0 && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                {currentQuestion < quiz.questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart Quiz
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentQuestion(index);
              setShowExplanation(false);
            }}
            className={`p-2 rounded-lg font-semibold transition-colors ${
              index === currentQuestion
                ? 'bg-blue-600 text-white'
                : selectedAnswers[index] !== null
                ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
