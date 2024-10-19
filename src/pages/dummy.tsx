import { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { useParams } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import CourseModal from "../components/CourseModal";
import LessonsModal from "../components/LessonsModal";
import PublishModal from "../components/PublishModal";
import Syllabus from "../components/Syllabus";
import "../styles/details.scss";

interface Course {
  course_id: string;
  course_title: string;
  short_description: string;
  long_description: string;
  image: string;
  is_published: boolean;
}

interface Page {
  page_number: number;
  content: Block[];
  syllabus: string;
}

interface Lesson {
  lesson_id: string;
  lesson_title: string;
  order: number;
  syllabus: string;
  completed: boolean;
  quiz_id: string;
}

function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [isSyllabusCollapsed, setIsSyllabusCollapsed] = useState(false);
  const pageCount = pages.length;
  const [showEditorContent, setshowEditorContent] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<Block[]>([]);
  const [isNewPage, setIsNewPage] = useState(false);
  const [syllabusId, setSyllabusId] = useState("");
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const onUpdateDashboard = async () => {
    fetchSyllabus();
  };

  useEffect(() => {
    console.log("Lessons length:", lessons.length);
    if (lessons.length === 0 && lessonsLoaded) {
      handleOpenLessonModal();
    }
  }, [lessons, lessonsLoaded]);

  useEffect(() => {
    const fetchSyllabusAndFirstLesson = async () => {
      try {
        const syllabusResponse = await axiosInstance.get(`/syllabi/${courseId}/`);
        const syllabusData = syllabusResponse.data[0];
        const fetchedSyllabusId = syllabusData.syllabus_id;
        setSyllabusId(fetchedSyllabusId);
  
        const updatedLessons = syllabusData.lessons.map((lesson: any) => ({
          ...lesson,
          completed: false, // default to false; update this as needed based on your logic
          quiz_id: lesson.quiz_id || "", // ensure quiz_id is available
        }));
        setLessons(updatedLessons);
        setLessonsLoaded(true);
  
        if (updatedLessons.length === 0) {
          handleOpenLessonModal();
        }
  
        if (updatedLessons.length > 0) {
          const firstLessonId = updatedLessons[0].lesson_id;
          setCurrentLesson(firstLessonId);
          await fetchPages(firstLessonId);
        }
      } catch (error) {
        console.error("Error fetching syllabus:", error);
      }
    };
  
    if (courseId) {
      fetchSyllabusAndFirstLesson();
    }
  }, [courseId]);

  const fetchSyllabus = async () => {
    try {
      const response = await axiosInstance.get(`/syllabi/${courseId}/`);
      const syllabusData = response.data[0];
      const sortedLessons = syllabusData.lessons.sort(
        (a: Lesson, b: Lesson) => a.order - b.order
      );
      setLessons(sortedLessons);
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchSyllabus();
    }
  }, [courseId]);
  

  const handleCheckboxChange = () => {
    setIsSyllabusCollapsed(!isSyllabusCollapsed);
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const response = await axiosInstance.get(`/courses/${courseId}/`);
      setCourseData(response.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const handleConfirmPublish = async () => {
    try {
      await axiosInstance.put(`/courses/${courseId}/publish/`, {
        isPublished: true,
      });
      console.log("Course published successfully");
      fetchCourseData();
    } catch (error) {
      console.error("Error in publishing course:", error);
    }
  };

  const handleOpenCourseModal = () => {
    fetchCourseData();
    setOpenModal("course");
  };

  const handleOpenLessonModal = () => {
    if (lessons.length === 0) {
      console.warn("No lessons available for updating");
      setOpenModal("lesson");
      return;
    }
    const currentLessonDetails = lessons.find(
      (l) => l.lesson_id === currentLesson
    );
    if (currentLessonDetails) {
      setSelectedLesson(currentLessonDetails);
    }
    setOpenModal("lesson");
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  const fetchPages = async (lessonId: String) => {
    try {
      const response = await axiosInstance.get(`/pages/${lessonId}/`);
      setPages(response.data);

      if (response.data.length > 0) {
        setEditorContent(response.data[0].content);
        setCurrentPage(0);
        setIsNewPage(false);
      } else {
        setEditorContent([]);
        setCurrentPage(0);
        setIsNewPage(true);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleLessonClick = async (lessonId: string) => {
    setCurrentLesson(lessonId);
    await fetchPages(lessonId);
    setshowEditorContent(true); 
  };

  const handlePageClick = async (event: { selected: number }) => {
    const newPageIndex = event.selected;
    console.log("Page clicked, selected index:", newPageIndex);
    setCurrentPage(newPageIndex);
    setIsNewPage(true);
    if (currentLesson) {
      try {
        const response = await axiosInstance.get(
          `/pages/${currentLesson}/${newPageIndex + 1}/`
        );
        if (response.data) {
          setEditorContent(response.data.content);
          setIsNewPage(false);
        }
      } catch (error: any) {}
    }
  };

  const handleOpenPublishModal = () => {
    setShowPublishModal(true);
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
  };

  const editor = useCreateBlockNote({
    initialContent: editorContent.length ? editorContent : [
      { type: "paragraph", content: "New page content" }
    ],
  });
  
  
  

  const handleEditorChange = (event: any, editor: any) => {
    const data = editor.getData();
    setEditorContent(data);
    console.log("Editor content (should be HTML):", data);
  };

  const saveEditorContent = async () => {
    if (!currentLesson || !syllabusId) {
      console.error("No current lesson or syllabus ID selected");
      return;
    }

    const pageId = isNewPage ? pages.length + 1 : currentPage + 1;
    const method = isNewPage ? "post" : "put";
    const apiUrl = `/pages/${currentLesson}/${pageId}/`;

    try {
      const payload = {
        page_number: pageId,
        content: editor.document,  // Get the latest editor content as blocks
        syllabus: "syllabusId",  // Replace with actual syllabusId
        lesson: currentLesson,
      };

      await axiosInstance[method](apiUrl, payload);
      console.log("Page saved successfully");
    } catch (error) {
      console.error("Error saving page content:", error);
    }
  };

  const handleNewPage = () => {
    setIsNewPage(true);
    setEditorContent([]);
    setCurrentPage(pages.length);
  };

  const handleEditorReady = (editor: any) => {
    const toolbarContainer = document.querySelector(".toolbar-container");
    if (toolbarContainer) {
      toolbarContainer.appendChild(editor.ui.view.toolbar.element);
    } else {
      console.error("Toolbar container not found");
    }
  };

  const mediaEmbedConfig = {
    toolbar: ["mediaEmbed"],
  };


  console.log("PageCount:", pageCount);

  const handleBackToSyllabus = () => {
    setshowEditorContent(false); 
  };

  const handleExamClick = () => {
    // props
  };

  return (
    <div className="dashboard-background">
      <header className="top-header">
        <h1>Course Management</h1>
        <button className="create-btn" onClick={handleOpenCourseModal}>
          Course
        </button>
        <button className="create-btn" onClick={handleOpenLessonModal}>
          Lesson
        </button>
        <button
          className={`create-btn ${
            courseData?.is_published ? "published" : ""
          }`}
          onClick={
            !courseData?.is_published ? handleOpenPublishModal : undefined
          }
          disabled={courseData?.is_published}
        >
          {courseData?.is_published ? "Published" : "Publish Course"}
        </button>
      </header>

      <div className={`course-page ${isSyllabusCollapsed ? "collapsed" : ""}`}>
        <input
          type="checkbox"
          id="checkbox"
          className="checkbox"
          checked={isSyllabusCollapsed}
          onChange={handleCheckboxChange}
        />
        <label htmlFor="checkbox" className="toggle">
          <div className="bars" id="bar1"></div>
          <div className="bars" id="bar2"></div>
          <div className="bars" id="bar3"></div>
        </label>

        <div className="lesson-content-container">
        {!showEditorContent && (
        <Syllabus
          classId={classId || ""} 
          lessons={lessons}
          onLessonClick={handleLessonClick}
          onExamClick={handleExamClick}
          currentLessonIndex={currentLesson ? lessons.findIndex(l => l.lesson_id === currentLesson) : 0}
          courseId={courseId || ""} 
        />
        )}
        {showEditorContent && (
            <button className="btnDets" onClick={handleBackToSyllabus} >
              Back
            </button>
          )}
          {showEditorContent && (
            <button className="btnDets" onClick={saveEditorContent}>
              Save Content
            </button>
          )}
          {showEditorContent && (
            <button className="btnDets" onClick={handleNewPage}>
              Add New Page
            </button>
          )}

          {showEditorContent && (
            <div className="blocknote-editor">
                   <BlockNoteView editor={editor} />
                  
            </div>
          )}

          {showEditorContent && pageCount > 1 && (
            <ReactPaginate
              previousLabel={currentPage > 0 ? "previous" : ""}
              nextLabel={currentPage < pageCount - 1 ? "next" : ""}
              breakLabel={"..."}
              pageCount={pageCount}
              onPageChange={handlePageClick}
              containerClassName={"pagination"}
              activeClassName={"active"}
              forcePage={currentPage}
            />
          )}
          </div>
        </div>

        {openModal === "course" && (
          <CourseModal
            closeModal={handleCloseModal}
            course={courseData}
            onUpdateDashboard={onUpdateDashboard}
          />
        )}

        {openModal === "lesson" && (
          <LessonsModal
            closeModal={handleCloseModal}
            syllabusId={syllabusId}
            onUpdateDashboard={onUpdateDashboard}
            initialLessonId={selectedLesson?.lesson_id}
            initialLessonTitle={selectedLesson?.lesson_title}
          />
        )}
        {showPublishModal && courseData && (
          <PublishModal
            closeModal={handleClosePublishModal}
            onConfirmPublish={handleConfirmPublish}
            courseData={courseData} // courseData is guaranteed not to be null here
          />
        )}
      </div>
  );
}

export default CourseDetails;
