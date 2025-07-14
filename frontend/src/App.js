import { useEffect, useState } from "react";
import axios from "axios";
import SemesterPlanner from "./components/SemesterPlanner";
import Login from "./Login";
import { supabase } from "./supabaseClient";

function App() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch courses from backend
  useEffect(() => {
    axios.get("http://localhost:8000/courses").then((res) => {
      setCourses(res.data);
    });
  }, []);

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-white mt-0 px-4">
      {/* Header */}
      <header className="mb-10 bg-gradient-to-r from-purple-700 to-purple-500 rounded-xl p-6 shadow-md text-white text-center relative">
        <h1 className="text-4xl font-extrabold">🦅 FalconSched</h1>
        <p className="mt-2 text-sm tracking-wide">
          View NYUAD CS courses and timings, straight from the source.
        </p>
        <button
          onClick={handleLogout}
          className="absolute top-4 right-6 bg-white text-purple-700 font-semibold px-3 py-1 rounded hover:bg-purple-100 text-sm"
        >
          Logout
        </button>
      </header>

      {/* --- CS Course Viewer Section --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-purple-700 mb-4">🧾 CS Courses Fall 2025</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-200 border border-purple-100"
            >
              <h3 className="text-lg font-bold text-purple-800 mb-2">
                {course.code} | {course.name}
              </h3>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                {course.timings.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* --- Semester Planner Section --- */}
      <section className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <SemesterPlanner />
      </section>
    </div>
  );
}

export default App;
