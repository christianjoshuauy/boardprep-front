import React, { useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import '../styles/challenge-result.scss';
import Mastery from '../pages/Mastery';

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  choices: Choice[];
  correct_option: string;
}

interface PreassessmentResultProps {
  questions: Question[];
  answers: { [questionId: string]: string };
  results: { [questionId: string]: boolean };
  score: number;
  totalQuestions: number;
  feedback: string | null;
  onDone: () => void;
}

const PreassessmentResult: React.FC<PreassessmentResultProps> = ({
  questions,
  answers,
  results,
  score,
  totalQuestions,
  feedback,
  onDone,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleToggleFeedback = () => {
    setShowFeedback(!showFeedback);
  };

  const percentage = (score / totalQuestions) * 100;
  let message = '';
  let resultClass = '';

  if (percentage >= 90) {
    message =
      'Thank you for completing the pre-assessment test. You have sufficient knowledge and skills, but adaptive learning can help you sharpen them even more!';
    resultClass = 'great';
  } else if (percentage >= 75) {
    message =
      'Not bad! You can make it, and adaptive learning will help you improve even further.';
    resultClass = 'good';
  } else {
    message =
      'Thank you for completing the pre-assessment test. Unfortunately, you still need to strengthen your fundamental knowledge and skills. Adaptive learning can help you through it.';
    resultClass = 'failed';
  }

  return (
    <div className="challenge-result">
      <h2>Preassessment Results</h2>
      <div className={`results-card ${resultClass}`}>
        <div className="results-summary">
          <div className="progressbar-container">
            <CircularProgressbar
              value={percentage}
              text={`${score} / ${totalQuestions}`}
              styles={{
                path: {
                  stroke:
                    resultClass === 'great'
                      ? '#4caf50'
                      : resultClass === 'good'
                      ? '#ffa726'
                      : '#f44336',
                },
                text: {
                  fill: 'black',
                  fontSize: '16px',
                },
                trail: {
                  stroke: '#d6d6d6',
                },
              }}
            />
          </div>
          <p>{message}</p>
        </div>
        <button className="view-results-button" onClick={handleToggleDetails}>
          {showDetails ? 'Hide Details' : 'View Results'}
        </button>
        <button className="view-results-button" onClick={handleToggleAnalysis}>
          {showAnalysis ? 'Hide Details' : 'View Analysis'}
        </button>
        <button
            className="view-results-button"
            onClick={handleToggleFeedback}
            disabled={loadingFeedback}
          >
            {showFeedback ? "Hide Feedback" : "View Feedback"}
          </button>
        {showDetails && (
          <div className="questions-review">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = results[question.id];
              const highlightColor = isCorrect ? '#4caf50' : '#f44336';

              return (
                <div
                  key={question.id}
                  className={`question-result ${
                    isCorrect ? 'correct' : 'incorrect'
                  }`}
                  style={{ borderColor: highlightColor }}
                >
                  <h3>Question {index + 1}</h3>
                  <p>{question.text}</p>
                  <ul>
                    {question.choices.map((choice) => {
                      const isSelected = userAnswer === choice.id;
                      return (
                        <li
                          key={choice.id}
                          className={isSelected ? 'selected-choice' : ''}
                          style={{
                            backgroundColor: isSelected
                              ? highlightColor
                              : 'transparent',
                          }}
                        >
                          {choice.text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {showAnalysis && (
          <Mastery />
        )}
        {showFeedback && feedback && (
          <div className="feedback-section">
            <h3>Feedback</h3>
            <p>{feedback}</p>
          </div>
        )}

        <div className="challenge-result-buttons">
          <button className="view-results-button" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreassessmentResult;