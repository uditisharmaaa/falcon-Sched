import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import samplePlan from "../data/samplePlan.json";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "../supabaseClient";

const initialSemesters = Object.entries(samplePlan).reduce((acc, [year, sems]) => {
  Object.entries(sems).forEach(([semester, courses]) => {
    const key = `${year} ${semester}`;
    acc[key] = courses.map((course) => ({
      id: course.id || uuidv4(),
      title: course.title,
      tag: course.tag || "Gen Elective",
      credits: course.credits || 4,
      completed: course.completed || false,
    }));
  });
  return acc;
}, {});

const yearOrder = ["Year 1", "Year 2", "Year 3", "Year 4"];
const semOrder = ["Fall", "Spring"];

const tagStyles = {
  "Major": "bg-purple-800 text-white", // <- add this
  "Core": "bg-purple-600 text-white",
  "Minor": "bg-purple-400 text-white",
  "Colloquium": "bg-purple-300 text-white",
  "Gen Elective": "bg-purple-200 text-gray-800",
  "Capstone": "bg-purple-700 text-white",
  "Major Elective": "bg-purple-500 text-white"
};

const allTags = Object.keys(tagStyles);
const majorCoreCourses = ["Introduction to Computer Science", "Data Structures", "Algorithms"];

export default function SemesterPlanner() {
  const [semesters, setSemesters] = useState(initialSemesters);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCreditsId, setEditCreditsId] = useState(null);
  const [selectedSem, setSelectedSem] = useState("Year 1 Fall");
  const [isPDFMode, setIsPDFMode] = useState(false);
  const plannerRef = useRef();

  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user ? null : data.user.id;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      const userId = await getUserId();
      if (!userId) return;

      const { data } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("id", userId)
        .single();

      if (data?.plan) {
        setSemesters(data.plan);
      }
    };

    fetchPlan();
  }, []);

  const saveToSupabase = async (newPlan) => {
    const userId = await getUserId();
    if (!userId) return;

    await supabase
      .from("user_plans")
      .upsert({ id: userId, plan: newPlan }, { onConflict: "id" });
  };

  const updateSemesters = (newSemesters) => {
    setSemesters(newSemesters);
    saveToSupabase(newSemesters);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const sourceKey = source.droppableId;
    const destKey = destination.droppableId;

    const updated = { ...semesters };
    const [moved] = updated[sourceKey].splice(source.index, 1);
    updated[destKey].splice(destination.index, 0, moved);
    updateSemesters(updated);
  };

  const calcCredits = (courses) =>
    courses.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0);

  const getProgress = () => {
    const allCourses = Object.values(semesters).flat();
    const completed = allCourses.filter((c) => c.completed).length;
    const total = allCourses.length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const getProgressByTag = () => {
    const allCourses = Object.values(semesters).flat();
    const tagStats = {};

    allCourses.forEach(course => {
      let tag = course.tag || "Gen Elective";
      if (majorCoreCourses.includes(course.title) && tag === "Gen Elective") {
        tag = "Major";  // <- now it will say "Major" instead of "Core"
      }
            if (!tagStats[tag]) tagStats[tag] = { total: 0, completed: 0 };
      tagStats[tag].total += 1;
      if (course.completed) tagStats[tag].completed += 1;
    });

    return tagStats;
  };

  const startEdit = (courseId, title) => {
    setEditingId(courseId);
    setEditValue(title);
  };

  const saveEdit = (courseId, semesterKey) => {
    const updated = { ...semesters };
    updated[semesterKey] = updated[semesterKey].map((c) =>
      c.id === courseId ? { ...c, title: editValue } : c
    );
    updateSemesters(updated);
    setEditingId(null);
    setEditValue("");
  };

  const updateTag = (courseId, semesterKey, newTag) => {
    const updated = { ...semesters };
    updated[semesterKey] = updated[semesterKey].map((c) =>
      c.id === courseId ? { ...c, tag: newTag } : c
    );
    updateSemesters(updated);
  };

  const updateCredits = (courseId, semesterKey, newCredits) => {
    const updated = { ...semesters };
    updated[semesterKey] = updated[semesterKey].map((c) =>
      c.id === courseId ? { ...c, credits: newCredits } : c
    );
    updateSemesters(updated);
  };

  const deleteCourse = (courseId, semesterKey) => {
    const updated = { ...semesters };
    updated[semesterKey] = updated[semesterKey].filter((c) => c.id !== courseId);
    updateSemesters(updated);
  };

  const addNewCourse = () => {
    const newCourse = {
      id: uuidv4(),
      title: "New Course",
      tag: "Gen Elective",
      credits: 4,
      completed: false,
    };
    const updated = { ...semesters };
    updated[selectedSem] = [...(updated[selectedSem] || []), newCourse];
    updateSemesters(updated);
  };

  const exportToPDF = async () => {
    setIsPDFMode(true);
    await new Promise((r) => setTimeout(r, 300));
    const input = plannerRef.current;
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save("semester_plan.pdf");

    setIsPDFMode(false);
  };

  const allSemesters = yearOrder.flatMap((year) =>
    semOrder.map((sem) => `${year} ${sem}`)
  );

  const tagProgress = getProgressByTag();

  return (
    <div className="mt-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-700">📋 Semester Planner</h2>
        <div className="flex gap-2 items-center">
          <select
            className="text-sm border border-purple-300 rounded px-2 py-1"
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
          >
            {allSemesters.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
          <button
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
            onClick={addNewCourse}
          >
            ➕ Add Course
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-2 text-purple-800">🎓 Degree Completion</h4>
        <div className="w-full bg-purple-100 rounded-full h-4">
          <div
            className="bg-purple-500 h-4 rounded-full"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1 text-gray-600">{getProgress()}% complete</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div ref={plannerRef} className={`bg-white p-4 rounded-md ${isPDFMode ? "pdf-mode" : ""}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {yearOrder.map((year) => (
              <div key={year} className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-center text-purple-700">{year}</h3>
                {semOrder.map((sem) => {
                  const key = `${year} ${sem}`;
                  const courses = semesters[key] || [];

                  return (
                    <Droppable droppableId={key} key={key}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="bg-white border border-purple-200 rounded-lg shadow p-4 min-h-[150px]"
                        >
                          <h4 className="text-sm font-semibold text-purple-700 mb-2 flex flex-col">
                            <span>{sem} ({calcCredits(courses)} credits)</span>
                            {calcCredits(courses) > 18 && (
                              <span className="text-red-600 font-bold text-xs mt-1">⚠️ OVERLOAD WARNING</span>
                            )}
                            {calcCredits(courses) < 16 && (
                              <span className="text-yellow-600 text-xs">⚠️ Light Load</span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {courses.map((course, index) => {
                              const isCore = majorCoreCourses.includes(course.title);
                              const tagClass = isCore
                                ? "bg-purple-800 text-white"
                                : tagStyles[course.tag] || tagStyles["Gen Elective"];

                              return (
                          <Draggable key={course.id} draggableId={course.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-purple-50 text-gray-800 rounded px-3 py-2 shadow flex flex-col gap-1 relative"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    {!isPDFMode && (
                                      <input
                                        type="checkbox"
                                        checked={course.completed}
                                        onChange={() => {
                                          const updated = { ...semesters };
                                          updated[key][index].completed = !updated[key][index].completed;
                                          updateSemesters(updated);
                                        }}
                                      />
                                    )}
                                    {editingId === course.id ? (
                                      <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit(course.id, key)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveEdit(course.id, key);
                                        }}
                                        className="w-full px-2 py-1 rounded border border-purple-300"
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() => startEdit(course.id, course.title)}
                                        className={`cursor-pointer ${
                                          course.completed ? "line-through text-gray-500" : ""
                                        }`}
                                      >
                                        {course.title}
                                      </span>
                                    )}
                                  </div>

                                  {!isPDFMode && (
                                    <div className="flex flex-col items-center gap-1">
                                      <button
                                        onClick={() => deleteCourse(course.id, key)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                      >
                                        🗑️
                                      </button>
                                      <input
                                        type="number"
                                        value={course.credits}
                                        min={1}
                                        max={6}
                                        className="w-10 text-xs px-1 border border-purple-300 rounded text-center"
                                        onChange={(e) =>
                                          updateCredits(course.id, key, parseInt(e.target.value))
                                        }
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="relative group inline-block">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                      majorCoreCourses.includes(course.title)
                                        ? "bg-purple-800 text-white"
                                        : tagStyles[course.tag] || tagStyles["Gen Elective"]
                                    } cursor-pointer`}
                                  >
                                    {course.tag}
                                  </span>
                                  {!isPDFMode && (
                                    <select
                                      value={course.tag}
                                      onChange={(e) => updateTag(course.id, key, e.target.value)}
                                      className="absolute left-0 top-5 z-10 text-xs border border-purple-300 rounded px-2 py-1 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                      {allTags.map((t) => (
                                        <option key={t} value={t}>
                                          {t}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className="mt-10">
        <h4 className="text-lg font-semibold text-purple-800 mb-4">📈 Progress by Category</h4>
        <div className="space-y-4">
          {Object.entries(tagProgress).map(([tag, { completed, total }]) => {
            const percent = total ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={tag}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-semibold">{tag}</span>
                  <span>{completed}/{total} completed</span>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-2">
                  <div
                    className={`${tagStyles[tag] || "bg-purple-300"} h-2 rounded-full`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={exportToPDF}
          className="bg-white text-purple-600 border border-purple-600 px-4 py-2 rounded hover:bg-purple-50"
        >
          📄 Export PDF
        </button>
      </div>
    </div>
  );
}
