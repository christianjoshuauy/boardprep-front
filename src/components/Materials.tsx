import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useAppSelector } from "../redux/hooks";
import { selectUser } from "../redux/slices/authSlice";
import "../styles/materials.scss";
import ExamContent from "./ExamContent";
import QuizContent from "./QuizContent";
import QuizResult from "./QuizResult";
import Syllabus from "./Syllabus";
import TipTapEditor from "./TipTap";

interface Page {
  page_id: string;
  page_number: number;
  content_blocks: ContentBlock[];
  syllabus: string;
}

interface Objective {
  text: string;
}

interface LearningObjective {
  id: number;
  text: string;
  subtopic: number;
}

interface Topic {
  topic_id: string;
  topic_title: string;
  order: number;
  subtopics: Subtopic[];
  learning_objectives: Objective[];
}

interface Subtopic {
  subtopic_id: string;
  subtopic_title: string;
  order: number;
}

interface Lesson {
  lesson_id: string;
  lesson_title: string;
  order: number;
  syllabus: string;
  content: string;
  completed: boolean;
  topics: Topic[];
  learning_objectives: Objective[];
  quiz_id: string;
}

interface Course {
  course_id: string;
  course_title: string;
}

interface MaterialsProps {
  courseId: string;
  studentId: string;
  classId: number;
}

interface ContentBlock {
  block_id: number;
  block_type: string;
  difficulty: string;
  content: string;
}

interface Mastery {
  id: number;
  mastery_level: number;
  questions_attempted: number;
  last_updated: string;
  student: string;
  learning_objective: number;
}

function Materials({ courseId, studentId, classId }: MaterialsProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageMapping, setPageMapping] = useState<{ [key: number]: string }>({});
  const [pageId, setPageId] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(-1);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [showLessonContent, setShowLessonContent] = useState(false);
  const [showQuizContent, setShowQuizContent] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showExamContent, setShowExamContent] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);
  const [examId, setExamId] = useState<number | null>(null);
  const [currentSubtopic, setCurrentSubtopic] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [hasPreassessment, setHasPreassessment] = useState(false);
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [progress, setProgress] = useState(0);
  const [clickedSubtopics, setClickedSubtopics] = useState<Set<string>>(
    new Set()
  );
  const [masteries, setMasteries] = useState<Mastery[]>([]);

  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const userType = user.token.type;

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
        const courseData: Course = courseResponse.data;
        setCourseTitle(courseData.course_title);

        const syllabusData = courseResponse.data.syllabus;
        if (syllabusData && syllabusData.lessons) {
          const lessonsData = syllabusData.lessons.map(
            (lesson: Lesson, index: number) => ({
              ...lesson,
              completed: false,
              quiz_id: `Lesson ${index + 1} Quiz`,
            })
          );
          setLessons(lessonsData);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    const checkAllLessonsCompleted = () => {
      const completed = lessons.every((lesson) => lesson.completed);
      setAllLessonsCompleted(completed);
    };

    checkAllLessonsCompleted();
  }, [lessons]);

  const fetchMastery = async () => {
    try {
      const response = await axiosInstance.get(
        `/mastery/?student_id=${studentId}`
      );
      setMasteries(response.data);
      setProgress(
        (response.data.filter((m: Mastery) => m.mastery_level >= 60).length /
          response.data.length) *
          100
      );
    } catch (error) {
      console.error("Error fetching mastery data:", error);
    }
  };

  useEffect(() => {
    fetchPreassessment();
    fetchMastery();
  }, []);

  const fetchPreassessment = async () => {
    try {
      const response = await axiosInstance.get(
        `/studentPreassessmentAttempt/?student_id=${studentId}&course_id=${courseId}`
      );
      if (response.data.length > 0) {
        setHasPreassessment(true);
      }
    } catch (error) {
      console.error("Error fetching preassessment data:", error);
    }
  };

  const fetchPages = async (subtopicId: string) => {
    if (!subtopicId) {
      console.error("Subtopic ID is undefined");
      return;
    }

    try {
      console.log(userType);
      const response = await axiosInstance.get(
        userType === "S"
          ? `/pages/by_subtopic/${subtopicId}/?student_id=${studentId}`
          : `/pages/by_subtopic/${subtopicId}/`
      );
      console.log("Fetched pages:", response.data);

      const fetchedPages = response.data.pages;
      setPageCount(fetchedPages.length);
      setObjectives(response.data.objectives);
      console.log("Page Count", pageCount);

      const pageMapping = fetchedPages.reduce(
        (acc: { [key: number]: string }, page: Page) => {
          acc[page.page_number] = page.page_id;
          return acc;
        },
        {}
      );

      setPages(response.data.pages);
      console.log("Fetched pages:", response.data.pages); // Confirm the fetched data
      setShowLessonContent(true);
      setPageMapping(pageMapping);
      if (response.data.length > 0) {
        setCurrentPage(response.data.pages[0].page_number);
        setPageId(response.data.pages[0].page_id);
      } else {
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleSubtopicClick = (subtopicId: string) => {
    setCurrentSubtopic(subtopicId);

    if (userType === "S" && !clickedSubtopics.has(subtopicId)) {
      setClickedSubtopics((prev) => new Set(prev).add(subtopicId));
    }

    fetchPages(subtopicId);
  };

  useEffect(() => {
    if (lessons.length > 0) {
      const totalSubtopics = lessons.reduce(
        (acc, lesson) =>
          acc +
          lesson.topics.reduce(
            (subAcc, topic) => subAcc + topic.subtopics.length,
            0
          ),
        0
      );
      const progressPercentage = (clickedSubtopics.size / totalSubtopics) * 100;
      //setProgress(progressPercentage);
    }
  }, [clickedSubtopics, lessons]);

  const handleTopicClick = (subtopicId: string) => {
    setCurrentSubtopic(subtopicId);
    fetchPages(subtopicId);
  };

  const renderObjectives = () => {
    console.log("test Subtopic:", currentSubtopic);
    console.log("Obj render:", objectives);

    return (
      <div className="objectives-container">
        <h3 className="h3-obj">Learning Objectives</h3>
        <ul className="objectives-list">
          {objectives.map((objective, idx) => (
            <li
              key={idx}
              className="objective-item"
              style={{
                color:
                  (masteries.find((m) => m.learning_objective === objective.id)
                    ?.mastery_level ?? 0) >= 60
                    ? "green"
                    : "black",
              }}
            >
              {objective.text}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const fetchQuizResult = async (quizId: string) => {
    try {
      const response = await axiosInstance.get(
        `/quizzes/${quizId}/results/${studentId}`
      );
      setQuizResult(response.data);
      setShowQuizResult(true);
      setShowQuizContent(false);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
    }
  };

  const handleLessonClick = async (lessonId: string) => {
    setCurrentLesson(lessonId);
  };

  // const handleLessonClick = (lessonId: string, isQuiz: boolean) => {
  //   if (isQuiz && lessons[currentLessonIndex]?.completed) {
  //     fetchQuizResult(lessons[currentLessonIndex].quiz_id);
  //   } else if (!isQuiz) {
  //     fetchPages(lessonId);
  //     setCurrentLesson(lessonId);
  //     setShowLessonContent(true);
  //     setShowQuizContent(false);
  //     setShowQuizResult(false);
  //     setShowExamContent(false);
  //   }
  // };

  const handlePageClick = async (event: { selected: number }) => {
    const newPageNumber = event.selected;
    const newPageId = pageMapping[newPageNumber];

    console.log("Page Number", newPageNumber);
    console.log("Page ID", newPageId);

    setCurrentPage(newPageNumber);
    if (newPageId) {
      try {
        const response = await axiosInstance.get(`/pages/${newPageId}`);
        if (response.data) {
          setPageId(Number(newPageId));
        }
      } catch (error) {
        console.error("Error fetching page data:", error);
      }
    }
  };

  const markLessonAsCompleted = () => {
    setLessons((prevLessons) =>
      prevLessons.map((lesson, index) =>
        index === currentLessonIndex ? { ...lesson, completed: true } : lesson
      )
    );

    setShowLessonContent(false);
    setShowQuizContent(true);
    setShowQuizResult(false);
    setShowExamContent(false);
  };

  const handleBackToSyllabus = () => {
    setShowLessonContent(false);
    setShowQuizContent(false);
    setShowQuizResult(false);
    setShowExamContent(false);
  };

  const handleTryAgain = () => {
    if (currentLessonIndex + 1 < lessons.length) {
      setShowLessonContent(false);
      setShowQuizContent(false);
      setShowQuizResult(false);
      setShowExamContent(false);

      setCurrentLessonIndex(currentLessonIndex + 1);
      const nextLesson = lessons[currentLessonIndex + 1].lesson_id;
      setCurrentLesson(nextLesson);
    } else {
      setShowLessonContent(false);
      setShowQuizContent(false);
      setShowQuizResult(false);
      setShowExamContent(false);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex + 1 < lessons.length) {
      setShowLessonContent(false);
      setShowQuizContent(false);
      setShowQuizResult(false);
      setShowExamContent(false);

      setCurrentLessonIndex(currentLessonIndex + 1);
      const nextLesson = lessons[currentLessonIndex + 1].lesson_id;
      setCurrentLesson(nextLesson);
    } else {
      setShowLessonContent(false);
      setShowQuizContent(false);
      setShowQuizResult(false);
      setShowExamContent(false);
    }
  };

  const handleQuizClick = (lessonID: string) => {
    setShowLessonContent(true);
    setShowQuizContent(true);
    setShowQuizResult(false);
    setShowExamContent(false);
    setCurrentLesson(lessonID);
    console.log("HANDLE QUIZ CLICKED");
    console.log(
      showQuizContent,
      currentLesson,
      showLessonContent,
      lessonID,
      currentLesson
    );
  };

  const handleStartPreassessment = () => {
    navigate(`/preassessment?course_id=${courseId}`);
  };

  const handleExam = () => {
    setShowLessonContent(true);
    setShowQuizContent(false);
    setShowQuizResult(false);
    setShowExamContent(true);
    console.log("HANDLE EXAM CLICKED");
  };

  return (
    <div className="materials-page">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}>
          {Math.round(progress)}%
        </div>
      </div>
      {!showLessonContent ? (
        <div className="lesson-content-container">
          <Syllabus
            lessons={lessons}
            onLessonClick={handleLessonClick}
            onTopicClick={handleTopicClick}
            onSubtopicClick={handleSubtopicClick}
            currentLesson={currentLesson}
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            handleQuizClick={(lessonID: string) => handleQuizClick(lessonID)}
            hasPreassessment={hasPreassessment}
          />
          {!hasPreassessment ? (
            <button
              className="preassessment-button"
              onClick={handleStartPreassessment}
            >
              Take preassessment
            </button>
          ) : (
            <button className="preassessment-button" onClick={handleExam}>
              Take exam
            </button>
          )}
        </div>
      ) : (
        <div className="lesson-content-container">
          <button className="btn-mat" onClick={handleBackToSyllabus}>
            Back to Syllabus
          </button>

          {currentPage === 0 && renderObjectives()}

          {pages[currentPage] && (
            <div key={pages[currentPage].page_id}>
              {pages[currentPage].content_blocks.map(
                (block: ContentBlock, idx: number) => (
                  <div className="tiptap-content">
                    <TipTapEditor
                      key={idx}
                      content={block.content}
                      editable={false}
                      hideToolbar
                    />
                  </div>
                )
              )}
            </div>
          )}

          {pageCount > 1 && showLessonContent && (
            <ReactPaginate
              previousLabel={currentPage > 0 ? "<" : ""}
              nextLabel={currentPage < pageCount - 1 ? ">" : ""}
              breakLabel={"..."}
              pageCount={pageCount}
              onPageChange={handlePageClick}
              containerClassName={"pagination"}
              activeClassName={"active"}
              forcePage={currentPage}
            />
          )}
          {showQuizContent && (
            <QuizContent
              lessonId={currentLesson}
              studentId={studentId}
              classInstanceId={classId}
              onTryAgain={handleTryAgain}
              onNextLesson={handleNextLesson}
            />
          )}

          {showExamContent && (
            <ExamContent
              studentId={studentId}
              classInstanceId={classId}
              courseId={courseId}
              title={courseTitle ?? "Final Exam"}
              onTryAgain={handleTryAgain}
              onNextLesson={handleNextLesson}
            />
          )}
        </div>
      )}

      {/*
          {showLessonContent && currentLesson && pages.length > 0 && (
            <LessonContent
              content={pages[currentPage].content}
              onBack={handleBackToSyllabus}
              markLessonAsCompleted={markLessonAsCompleted}
              userType={userType}
              studentId={studentId}
              lessonId={currentLesson}
              classInstanceId={classId}
              passed={quizResult?.passed ?? false}
              examId={examId ?? -1}
            />
          )} */}

      {showQuizResult && quizResult && (
        <QuizResult
          questions={quizResult.questions}
          answers={quizResult.answers}
          results={quizResult.results}
          score={quizResult.score}
          totalQuestions={quizResult.totalQuestions}
          passed={quizResult.passed}
          onTryAgain={handleTryAgain}
          onNextLesson={handleNextLesson}
        />
      )}
    </div>
  );
}

export default Materials;
