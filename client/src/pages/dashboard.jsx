// Role-aware LMS workspace pages and learning workflows.
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, Check, CheckCircle2,
  Camera, ChevronDown, ChevronRight, CircleHelp, Clock3, GraduationCap, LoaderCircle,
  LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Pencil, Plus,
  Search, Settings2, Sparkles, Trash2, Users, Video, X,
} from "lucide-react";
import {
  useAddLessonMutation, useUpdateLessonMutation, useDeleteLessonMutation, useAssignmentsQuery, useChangeRoleMutation, useCompleteLessonMutation,
  useAnnouncementsQuery, useChangePasswordMutation, useCourseMessagesQuery, useCourseQuery,
  useCourseStudentsQuery, useCoursesQuery, useCreateAnnouncementMutation, useUpdateAnnouncementMutation, useCreateAssignmentMutation, useUpdateAssignmentMutation, useDeleteAssignmentMutation,
  useCreateCourseMutation, useCreateQuizMutation, useDeleteAnnouncementMutation, useDeleteCourseMutation,
  useDeleteResourceMutation, useEnrollMutation, useGradeSubmissionMutation, useLearnersQuery,
  useLogoutMutation, useSendCourseMessageMutation, useSetUserActiveMutation, useSubmitAssignmentMutation,
  useQuizAttemptsQuery, useSubmitQuizAttemptMutation, useUpdateCourseMutation, useUpdateProfileMutation, useUpdateQuizMutation,
  useUploadResourceMutation, useUsersQuery, useUploadProfilePhotoMutation, useRemoveProfilePhotoMutation,
} from "../features/api/apiSlice";
import ThemeToggle from "../components/ThemeToggle";

const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-400";
const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
const roleNavigation = {
  student: [
    { id: "Home", label: "Dashboard", group: "Learning", icon: LayoutDashboard },
    { id: "My learning", label: "My learning", group: "Learning", icon: BookOpen },
    { id: "Catalog", label: "Course catalog", group: "Learning", icon: Search },
    { id: "Schedule", label: "Schedule", group: "Learning", icon: Clock3 },
    { id: "Assignments", label: "Assignments", group: "Academic", icon: CheckCircle2 },
    { id: "Grades", label: "Grades", group: "Academic", icon: Award },
    { id: "Announcements", label: "Announcements", group: "Academic", icon: Sparkles },
    { id: "Profile", label: "Profile & settings", group: "Account", icon: Settings2 },
  ],
  teacher: [
    { id: "Home", label: "Overview", group: "Workspace", icon: LayoutDashboard },
    { id: "My courses", label: "My courses", group: "Teaching", icon: BookOpen },
    { id: "Learners", label: "Learners", group: "Teaching", icon: Users },
    { id: "Schedule", label: "Schedule", group: "Teaching", icon: Clock3 },
    { id: "Assignments", label: "Assignments & grading", group: "Academic", icon: CheckCircle2 },
    { id: "Announcements", label: "Announcements", group: "Academic", icon: Sparkles },
    { id: "Profile", label: "Profile & settings", group: "Account", icon: Settings2 },
  ],
  admin: [
    { id: "Home", label: "Overview", group: "Workspace", icon: LayoutDashboard },
    { id: "Courses", label: "Courses", group: "Management", icon: BookOpen },
    { id: "People", label: "People & roles", group: "Management", icon: Users },
    { id: "Reports", label: "Reports", group: "Management", icon: BarChart3 },
    { id: "Announcements", label: "Announcements", group: "Updates", icon: Sparkles },
    { id: "Profile", label: "Profile & settings", group: "Account", icon: Settings2 },
  ],
};

function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("Home");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [focusedAssignmentId, setFocusedAssignmentId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All topics");
  const isStaff = user.role === "teacher" || user.role === "admin";
  const nav = roleNavigation[user.role] || roleNavigation.student;
  const navGroups = nav.reduce((groups, item) => {
    (groups[item.group] ||= []).push(item);
    return groups;
  }, {});
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useCoursesQuery();
  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignmentsQuery();
  const { data: announcementsData, isLoading: announcementsLoading } = useAnnouncementsQuery();
  const { data: usersData } = useUsersQuery(undefined, { skip: user.role !== "admin" });
  const { data: learnersData } = useLearnersQuery(undefined, { skip: !isStaff });
  const { data: rosterData } = useCourseStudentsQuery(selectedCourse?._id, { skip: !selectedCourse || !isStaff });
  const [createCourse, { isLoading: creatingCourse }] = useCreateCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [addLesson] = useAddLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [enroll] = useEnrollMutation();
  const [completeLesson] = useCompleteLessonMutation();
  const [createAssignment] = useCreateAssignmentMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const [submitAssignment] = useSubmitAssignmentMutation();
  const [gradeSubmission] = useGradeSubmissionMutation();
  const [changeRole] = useChangeRoleMutation();
  const [setUserActive] = useSetUserActiveMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [uploadResource] = useUploadResourceMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [createQuiz] = useCreateQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [submitQuizAttempt] = useSubmitQuizAttemptMutation();
  const [logout] = useLogoutMutation();
  const [uploadProfilePhoto, { isLoading: uploadingPhoto }] = useUploadProfilePhotoMutation();
  const [removeProfilePhoto, { isLoading: removingPhoto }] = useRemoveProfilePhotoMutation();
  const [logoutPending, setLogoutPending] = useState(false);

  const courses = coursesData?.courses || [];
  const assignments = assignmentsData?.assignments || [];
  const announcements = announcementsData?.announcements || [];
  const users = usersData?.users || [];
  const learners = learnersData?.learners || [];
  const enrolledIds = useMemo(() => new Set((user.enrolledCourses || []).map((id) => String(id._id || id))), [user.enrolledCourses]);
  const completedIds = useMemo(() => new Set((user.completedLessons || []).map((id) => String(id._id || id))), [user.completedLessons]);
  const enrolledCourses = courses.filter((course) => enrolledIds.has(course._id));
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.description} ${course.category} ${course.level || ""} ${course.instructor?.name || ""}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (category === "All topics" || course.category === category);
  });
  const categories = ["All topics", ...new Set(courses.map((course) => course.category).filter(Boolean))];
  const pageTitle = selectedCourse && page === "Course room" ? selectedCourse.title : (nav.find((item) => item.id === page)?.label || page);
  const { data: selectedCourseData } = useCourseQuery(selectedCourse?._id, { skip: !selectedCourse });

  const run = async (action, successMessage) => {
    try {
      const result = await action();
      setNotice(result?.message || successMessage || "Saved successfully.");
      return result;
    } catch (error) {
      setNotice(error?.data?.message || "Something went wrong. Please try again.");
      return null;
    }
  };
  const navigate = (destination) => {
    setSelectedCourse(null);
    setFocusedAssignmentId(null);
    setPage(destination);
    setMobileNavOpen(false);
    setProfileMenuOpen(false);
    setNotice("");
  };
  const openAssignment = (assignment) => {
    setSelectedCourse(null);
    setFocusedAssignmentId(assignment._id);
    setPage("Assignments");
    setMobileNavOpen(false);
    setNotice("");
  };
  const openCourse = (course) => {
    setSelectedCourse(course);
    setPage("Course room");
    setMobileNavOpen(false);
    setNotice("");
  };
  const createNewCourse = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    run(() => createCourse(values).unwrap(), "Course created. Add lessons and publish it when ready.");
    form.reset();
  };
  const doLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    try {
      await logout().unwrap();
      onLogout();
    } catch (error) {
      setNotice(error?.data?.message || "Could not sign out. Please try again.");
      setLogoutPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileNavOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"/>}
      <aside aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[var(--sidebar)] px-3 py-5 text-white shadow-2xl shadow-black/10 transition-[width,transform] duration-200 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "lg:w-[88px]" : "lg:w-[260px]"}`}>
        <div className={`flex h-12 items-center ${sidebarCollapsed ? "lg:justify-center" : "justify-between"}`}>
          <button onClick={() => navigate("Home")} title="SmartLearn home" className="flex min-w-0 items-center gap-3 rounded-xl px-2 text-left">
            <span className="brand-mark grid size-10 shrink-0 place-items-center rounded-xl shadow-sm"><GraduationCap size={23}/></span>
            <span className={`${sidebarCollapsed ? "lg:hidden" : ""} truncate text-lg font-bold tracking-tight`}>SmartLearn</span>
          </button>
          <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden size-9 shrink-0 place-items-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white lg:grid">
            {sidebarCollapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}
          </button>
          <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"><X size={19}/></button>
        </div>
        <div className={`mt-8 flex-1 space-y-6 overflow-y-auto px-1 ${sidebarCollapsed ? "lg:px-0" : ""}`}>
          {Object.entries(navGroups).map(([group, items]) => <section key={group}>
            <h2 title={sidebarCollapsed ? group : undefined} className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/45 ${sidebarCollapsed ? "lg:sr-only" : ""}`}>{group}</h2>
            <nav className="space-y-1" aria-label={group}>
              {items.map(({ id, label, icon: Icon }) => <NavButton key={id} active={page === id} onClick={() => navigate(id)} icon={<Icon size={18}/>} label={label} collapsed={sidebarCollapsed}/>) }
            </nav>
          </section>)}
        </div>
        <div className={`mt-5 border-t border-white/10 pt-4 ${sidebarCollapsed ? "lg:px-0" : "px-1"}`}>
          <button type="button" onClick={() => navigate("Profile")} title={user.name} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <Avatar name={user.name} photoURL={user.photoURL} userId={user._id} className="size-9 bg-white/15 text-white"/>
            <span className={`${sidebarCollapsed ? "lg:hidden" : ""} min-w-0 flex-1`}><span className="block truncate text-sm font-semibold">{user.name}</span><span className="mt-0.5 block text-xs capitalize text-white/55">{user.role} account</span></span>
          </button>
          <button disabled={logoutPending} onClick={doLogout} title={sidebarCollapsed ? "Sign out" : undefined} className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-50 ${sidebarCollapsed ? "lg:justify-center" : ""}`}><LogOut size={17}/><span className={sidebarCollapsed ? "lg:hidden" : ""}>{logoutPending ? "Signing out…" : "Sign out"}</span></button>
        </div>
      </aside>

      <main className={`mx-auto min-h-screen min-w-0 w-full max-w-[1600px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7 ${sidebarCollapsed ? "lg:ml-[88px] lg:w-[calc(100%-88px)]" : "lg:ml-[260px] lg:w-[calc(100%-260px)]"}`}>
        <header className="sticky top-0 z-30 -mx-4 mb-6 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation" className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"><Menu size={19}/></button>
            <div className="min-w-0"><p className="hidden truncate text-xs font-medium text-slate-500 sm:block">Workspace <span className="px-1 text-slate-300">/</span> <span className="capitalize">{user.role}</span> <span className="px-1 text-slate-300">/</span> {pageTitle}</p><h1 className="truncate text-xl font-bold tracking-tight sm:mt-1 sm:text-2xl">{page === "Home" ? `Welcome back, ${user.name.split(" ")[0]}` : pageTitle}</h1></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle/>
            <div className="relative">
              <button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-expanded={profileMenuOpen} aria-label="Open profile menu" className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100 sm:gap-3 sm:px-2">
                <Avatar name={user.name} photoURL={user.photoURL} userId={user._id}/><span className="hidden min-w-0 sm:block"><span className="block max-w-36 truncate text-sm font-semibold">{user.name}</span><span className="block text-xs capitalize text-slate-500">{user.role}</span></span><ChevronDown size={15} className="hidden text-slate-400 sm:block"/>
              </button>
              {profileMenuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button onClick={() => navigate("Profile")} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">Profile & settings</button><button disabled={logoutPending} onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"><LogOut size={15}/> {logoutPending ? "Signing out…" : "Sign out"}</button></div>}
            </div>
          </div>
        </header>

        {notice && <div role="status" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification" className="rounded p-1 hover:bg-indigo-100"><X size={16}/></button></div>}

        {page === "Home" && <HomePage user={user} courses={courses} assignments={assignments} users={users} enrolledCourses={enrolledCourses} completedIds={completedIds} loading={coursesLoading} openCourse={openCourse} openAssignment={openAssignment} navigate={navigate} />}
        {page === "My learning" && <StudentCourses courses={enrolledCourses} loading={coursesLoading} error={coursesError} completedIds={completedIds} openCourse={openCourse} emptyAction={() => navigate("Catalog")} />}
        {page === "Catalog" && <CatalogPage courses={filteredCourses.filter((course) => !enrolledIds.has(course._id))} allCourses={courses} categories={categories} search={search} setSearch={setSearch} category={category} setCategory={setCategory} loading={coursesLoading} error={coursesError} enroll={(id) => run(() => enroll(id).unwrap(), "You are enrolled. Open My learning to begin.")} openCourse={openCourse} enrolledIds={enrolledIds} />}
        {page === "Course room" && selectedCourse && <CourseRoom course={selectedCourseData?.course || courses.find((course) => course._id === selectedCourse._id) || selectedCourse} user={user} teachers={users.filter((person) => person.role === "teacher")} assignments={assignments.filter((assignment) => String(assignment.course?._id || assignment.course) === selectedCourse._id)} enrolled={enrolledIds.has(selectedCourse._id)} completedIds={completedIds} roster={rosterData?.students || []} onBack={() => navigate(user.role === "student" ? "My learning" : user.role === "teacher" ? "My courses" : "Courses")} onAction={run} actions={{ updateCourse, deleteCourse, addLesson, updateLesson, deleteLesson, enroll, completeLesson, createAssignment, createAnnouncement, deleteResource, uploadResource, createQuiz, updateQuiz, submitQuizAttempt }} openAssignments={() => navigate("Assignments")} openAssignment={openAssignment} />}
        {page === "Course room" && selectedCourse && <CourseExtras course={selectedCourseData?.course || selectedCourse} user={user} onAction={run} actions={{ uploadResource, deleteResource, createQuiz, updateQuiz, submitQuizAttempt, createAnnouncement, sendMessage: null }} />}
        {page === "My courses" && <TeacherCourses courses={courses} loading={coursesLoading} error={coursesError} creating={creatingCourse} onCreate={createNewCourse} openCourse={openCourse} />}
        {page === "Courses" && user.role === "admin" && <AdminCourses courses={courses} teachers={users.filter((person) => person.role === "teacher")} loading={coursesLoading} error={coursesError} creating={creatingCourse} onCreate={createNewCourse} openCourse={openCourse} />}
        {page === "Assignments" && <AssignmentsPage user={user} assignments={assignments} loading={assignmentsLoading} onAction={run} submit={submitAssignment} grade={gradeSubmission} updateAssignment={updateAssignment} deleteAssignment={deleteAssignment} gradedOnly={false} focusedAssignmentId={focusedAssignmentId} onClearFocus={() => setFocusedAssignmentId(null)} />}
        {page === "Schedule" && <SchedulePage assignments={assignments} user={user} loading={assignmentsLoading} openAssignment={openAssignment} />}
        {page === "Announcements" && <AnnouncementsPage announcements={announcements} loading={announcementsLoading} isStaff={isStaff} user={user} courses={courses} onAction={run} createAnnouncement={createAnnouncement} updateAnnouncement={updateAnnouncement} deleteAnnouncement={deleteAnnouncement} />}
        {page === "Grades" && <GradesPage assignments={assignments} loading={assignmentsLoading} />}
        {page === "Learners" && user.role === "teacher" && <LearnersPage learners={learners} courses={courses} loading={coursesLoading} openCourse={openCourse} />}
        {page === "People" && user.role === "admin" && <PeoplePage users={users} changeRole={(id, role) => run(() => changeRole({ id, role }).unwrap(), "Member role updated.")} setActive={(id,isActive) => run(() => setUserActive({id,isActive}).unwrap(), "Account status updated.")} />}
        {page === "Reports" && user.role === "admin" && <ReportsPage courses={courses} users={users} assignments={assignments} learners={learners} />}
        {page === "Profile" && <ProfilePage user={user} onAction={run} updateProfile={updateProfile} changePassword={changePassword} uploadPhoto={uploadProfilePhoto} removePhoto={removeProfilePhoto} photoBusy={uploadingPhoto || removingPhoto} />}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, collapsed }) {
  return <button onClick={onClick} title={collapsed ? label : undefined} aria-label={label} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${collapsed ? "lg:justify-center lg:px-0" : ""} ${active ? "border-white/10 bg-white/15 text-white shadow-sm" : "border-transparent text-white/65 hover:bg-white/10 hover:text-white"}`}>{icon}<span className={collapsed ? "lg:hidden" : ""}>{label}</span>{active && <ChevronRight size={15} className={`ml-auto ${collapsed ? "lg:hidden" : ""}`}/>}</button>;
}

function Avatar({ name, photoURL, userId, className = "" }) {
  const [imageFailedFor, setImageFailedFor] = useState("");
  const initials = (name || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const photoSrc = photoURL?.startsWith("http") ? photoURL : photoURL && userId ? `${apiOrigin}/api/v1/user/${userId}/photo?v=${encodeURIComponent(photoURL)}` : "";
  return <span className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ${className}`}>{initials}{photoSrc && imageFailedFor !== photoSrc && <img src={photoSrc} alt="" className="absolute inset-0 size-full object-cover" onError={() => setImageFailedFor(photoSrc)}/>}</span>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">{eyebrow}</p>}<h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>;
}

function StatCard({ label, value, caption, icon: Icon, tint = "indigo" }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-600", teal: "bg-teal-50 text-teal-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${colors[tint]}`}><Icon size={19}/></span></div>{caption && <p className="mt-3 text-xs text-slate-400">{caption}</p>}</article>;
}

function HomePage({ user, courses, assignments, users, enrolledCourses, completedIds, loading, openCourse, openAssignment, navigate }) {
  const studentAssignments = user.role === "student" ? assignments : [];
  const waiting = studentAssignments.filter((item) => !item.submissions?.length);
  const gradedScores = studentAssignments.flatMap((item) => (item.submissions || []).filter((submission) => submission.grade !== null && submission.grade !== undefined).map((submission) => Number(submission.grade)));
  const averageGrade = gradedScores.length ? `${Math.round(gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length)}%` : "?";
  const totalLessons = enrolledCourses.reduce((total, course) => total + (course.lessonCount ?? course.lessons?.length ?? 0), 0);
  const progress = totalLessons ? Math.round((completedIds.size / totalLessons) * 100) : 0;
  const submissionCount = assignments.reduce((count, assignment) => count + (assignment.submissions?.length || 0), 0);
  const roleLabel = user.role === "student" ? "Your learning" : user.role === "teacher" ? "Your teaching" : "Platform snapshot";
  return <div className="mt-7 space-y-7">
    <section className="relative overflow-hidden rounded-3xl bg-[var(--sidebar)] p-6 text-white shadow-sm sm:p-8"><div className="relative z-10 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85"><Sparkles size={14}/> {roleLabel}</div><h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{user.role === "student" ? "Make today a learning day." : user.role === "teacher" ? "Build a classroom that keeps moving." : "Your learning community is growing."}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">{user.role === "student" ? "Pick up a lesson, explore a new subject, or see what is due next." : user.role === "teacher" ? "Create thoughtful courses, follow learner progress, and give useful feedback." : "Review courses, support educators, and keep your platform organized."}</p><button onClick={() => navigate(user.role === "student" ? "My learning" : user.role === "teacher" ? "My courses" : "Courses")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-black/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]">{user.role === "student" ? "Continue learning" : "Manage courses"}<ArrowRight size={16}/></button></div></section>

    {user.role === "student" ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Enrolled courses" value={enrolledCourses.length} caption="Your active learning paths" icon={BookOpen}/><StatCard label="Completed lessons" value={completedIds.size} caption={`${Math.min(progress,100)}% of enrolled lesson content`} icon={CheckCircle2} tint="teal"/><StatCard label="Pending assignments" value={waiting.length} caption="Work waiting for your submission" icon={Clock3} tint="amber"/><StatCard label="Average grade" value={averageGrade} caption={gradedScores.length ? `Across ${gradedScores.length} reviewed assignment${gradedScores.length===1?"":"s"}` : "Grades appear after work is reviewed"} icon={Award} tint="violet"/></div>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-700">Learning progress</p><h3 className="mt-1 text-lg font-bold">Your overall progress</h3><p className="mt-1 text-sm text-slate-500">{completedIds.size} of {totalLessons} lessons completed across your courses</p></div><span className="text-3xl font-bold tracking-tight text-indigo-700">{Math.min(progress,100)}%</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${Math.min(progress,100)}%`}}/></div></section>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><section><PageHeading title="Continue learning" description="Jump back into one of your enrolled courses." action={<button onClick={() => navigate("My learning")} className={secondary}>All my courses <ArrowRight size={15}/></button>}/>{loading ? <Loading/> : enrolledCourses.length ? <div className="grid gap-4 md:grid-cols-2">{enrolledCourses.slice(0, 4).map((course, index) => <CourseTile key={course._id} course={course} index={index} enrolled completedIds={completedIds} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="Your learning space is ready" text="Enroll in a course to start learning and track your progress here." action={<button onClick={() => navigate("Catalog")} className={button}>Browse the catalog</button>}/>}</section>
        <section><PageHeading title="Coming up" description="Assignments from your enrolled courses." action={<button onClick={() => navigate("Assignments")} className="text-sm font-semibold text-indigo-700">See all</button>}/><div className="rounded-2xl border border-slate-200/80 bg-white p-2">{studentAssignments.slice(0, 4).map((assignment) => <AssignmentPreview key={assignment._id} assignment={assignment} onClick={() => openAssignment(assignment)}/>)}{!studentAssignments.length && <div className="p-6 text-center text-sm text-slate-500">No assignments yet. They will appear here when your course includes them.</div>}</div></section></div>
    </> : user.role === "teacher" ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Your courses" value={courses.length} caption={`${courses.filter((course) => course.published).length} published`} icon={BookOpen}/><StatCard label="Learners" value={learnersCount(courses)} caption="Across your courses" icon={Users} tint="teal"/><StatCard label="Assignments" value={assignments.length} caption="Created for your courses" icon={CheckCircle2} tint="amber"/><StatCard label="Submissions" value={submissionCount} caption="Learner work received" icon={Activity} tint="violet"/></div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section><PageHeading title="Course workspace" description="Keep your course content up to date." action={<button onClick={() => navigate("My courses")} className={secondary}>Open studio <ArrowRight size={15}/></button>}/>{loading ? <Loading/> : courses.length ? <div className="grid gap-4 md:grid-cols-2">{courses.slice(0, 4).map((course, index) => <CourseTile key={course._id} course={course} index={index} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="Create your first course" text="Add course details and lessons, then publish it so learners can enroll." action={<button onClick={() => navigate("My courses")} className={button}>Open course studio</button>}/>}</section><section><PageHeading title="Needs attention" description="Submissions waiting to be reviewed." action={<button onClick={() => navigate("Assignments")} className="text-sm font-semibold text-indigo-700">Review work</button>}/><div className="rounded-2xl border border-slate-200/80 bg-white p-2">{assignments.flatMap((assignment) => (assignment.submissions || []).filter((submission) => submission.grade === null || submission.grade === undefined).map((submission) => <div key={submission._id} className="flex items-center gap-3 rounded-xl p-3"><Avatar name={submission.student?.name || "Learner"}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{submission.student?.name}</p><p className="truncate text-xs text-slate-500">{assignment.title}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Review</span></div>)).slice(0, 5)}{!submissionCount && <div className="p-6 text-center text-sm text-slate-500">New submissions will show here.</div>}</div></section></div>
    </> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Platform users" value={users.length} caption="Students, teachers, and admins" icon={Users}/><StatCard label="Courses" value={courses.length} caption={`${courses.filter((course) => course.published).length} currently published`} icon={BookOpen} tint="teal"/><StatCard label="Enrollments" value={learnersCount(courses)} caption="Learners enrolled in courses" icon={GraduationCap} tint="violet"/><StatCard label="Submissions" value={submissionCount} caption="Assignments submitted" icon={Activity} tint="amber"/></div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section><PageHeading title="Platform courses" description="Review the courses currently in SmartLearn." action={<button onClick={() => navigate("Courses")} className={secondary}>Manage courses <ArrowRight size={15}/></button>}/>{courses.length ? <div className="grid gap-4 md:grid-cols-2">{courses.slice(0, 4).map((course, index) => <CourseTile key={course._id} course={course} index={index} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="No courses yet" text="Create a course and assign a teacher to start your catalog." action={<button onClick={() => navigate("Courses")} className={button}>Create a course</button>}/>}</section><section className="rounded-2xl border border-slate-200/80 bg-white p-5"><PageHeading title="Quick links" description="Common admin tasks"/><div className="space-y-2"><QuickLink icon={Users} title="Manage people and roles" onClick={() => navigate("People")}/><QuickLink icon={BookOpen} title="Review course catalog" onClick={() => navigate("Courses")}/><QuickLink icon={BarChart3} title="Open platform reports" onClick={() => navigate("Reports")}/></div></section></div>
    </>}
  </div>;
}

function learnersCount(courses) { return courses.reduce((count, course) => count + (course.enrollmentCount || 0), 0); }

function StudentCourses({ courses, loading, error, completedIds, openCourse, emptyAction }) {
  if (loading) return <div className="mt-7"><Loading/></div>;
  if (error) return <div className="mt-7"><EmptyState icon={CircleHelp} title="Could not load courses" text="Check that the API is running, then refresh this page."/></div>;
  return <section className="mt-7"><PageHeading eyebrow="Your library" title="My learning" description="Your enrolled courses, lesson completion, and next steps." action={<span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{courses.length} courses</span>}/>{courses.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course, index) => <CourseTile key={course._id} course={course} index={index} enrolled completedIds={completedIds} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="Nothing in your library yet" text="Browse the catalog and enroll in a course to get started." action={<button onClick={emptyAction} className={button}>Explore courses</button>}/>}</section>;
}

function CatalogPage({ courses, allCourses, categories, search, setSearch, category, setCategory, loading, error, enroll, openCourse }) {
  if (loading) return <div className="mt-7"><Loading/></div>;
  if (error) return <div className="mt-7"><EmptyState icon={CircleHelp} title="Catalog unavailable" text="The course catalog could not be loaded. Check your connection and try again."/></div>;
  const clearSearch = () => { setSearch(""); setCategory("All topics"); };
  return <section className="mt-7"><PageHeading eyebrow="Find your next skill" title="Course catalog" description={`${allCourses.length} course${allCourses.length === 1 ? "" : "s"} available to explore.`}/><div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Search courses by title, instructor, or topic" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses, instructors, or topics" className={field + " pl-10 pr-20"}/>{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Clear</button>}</div><select aria-label="Filter catalog by category" value={category} onChange={(event) => setCategory(event.target.value)} className={field + " sm:max-w-56"}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>{courses.length ? <><p className="mb-3 text-xs font-medium text-slate-500">Showing {courses.length} course{courses.length === 1 ? "" : "s"}</p><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course, index) => <CourseTile key={course._id} course={course} index={index} onOpen={() => openCourse(course)} action={<button onClick={() => enroll(course._id)} className={button}>Enroll now <ArrowRight size={15}/></button>}/>)}</div></> : <EmptyState icon={Search} title="No matching courses" text="Try a different search phrase or topic." action={<button onClick={clearSearch} className={secondary}>Clear filters</button>}/>}</section>;
}

const coverStyles = ["bg-[var(--cover-1)]", "bg-[var(--cover-2)]", "bg-[var(--cover-3)]", "bg-[var(--cover-4)]"];
function CourseTile({ course, index = 0, enrolled = false, completedIds = new Set(), onOpen, action }) {
  const lessons = course.lessonCount ?? course.lessons?.length ?? 0;
  const done = (course.lessons || []).filter((lesson) => completedIds.has(lesson._id)).length;
  const percent = enrolled && lessons ? Math.min(100, Math.round((done / lessons) * 100)) : 0;
  return <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50"><button onClick={onOpen} className={`relative flex h-32 w-full items-end ${coverStyles[index % coverStyles.length]} p-4 text-left text-white`}><span className="absolute right-4 top-3 grid size-10 place-items-center rounded-xl bg-white/15"><BookOpen size={20}/></span><span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">{course.category || "General"}</span></button><div className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><span>{course.level || "Beginner"}</span><span>·</span><span>{lessons} lesson{lessons === 1 ? "" : "s"}</span>{course.published === false && <span className="ml-auto rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">Draft</span>}</div><button onClick={onOpen} className="mt-2 text-left text-base font-bold leading-6 hover:text-indigo-700">{course.title}</button><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{course.description}</p><div className="mt-3 flex items-center gap-2"><Avatar name={course.instructor?.name || "SmartLearn Instructor"} className="size-7 text-[10px]"/><span className="truncate text-xs text-slate-500">{course.instructor?.name || "SmartLearn Instructor"}</span></div>{enrolled && <div className="mt-4"><div className="mb-1.5 flex justify-between text-[11px] font-medium text-slate-500"><span>Course progress</span><span>{percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${percent}%`}}/></div></div>}<div className="mt-4 flex gap-2">{action || <button onClick={onOpen} className={secondary + " w-full"}>{enrolled ? "Continue learning" : "View course"}<ArrowRight size={15}/></button>}</div></div></article>;
}

function CourseRoom({ course, user, teachers, assignments, enrolled, completedIds, roster, onBack, onAction, actions, openAssignments, openAssignment }) {
  const staff = user.role === "teacher" || user.role === "admin";
  const lessons = course.lessons || [];
  const totalLessons = course.lessonCount ?? lessons.length;
  const done = lessons.filter((lesson) => completedIds.has(lesson._id)).length;
  const [showEditing, setShowEditing] = useState(false);
  return <section className="mt-7"><button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={16}/> Back to {staff ? "courses" : "my learning"}</button>
    <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white"><div className="bg-gradient-to-r from-indigo-700 to-violet-600 p-6 text-white sm:p-9"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">{course.category || "General"} · {course.level || "Beginner"}</span><h2 className="mt-4 text-3xl font-bold tracking-tight">{course.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">{course.description}</p><p className="mt-4 text-sm text-indigo-100">Instructor: {course.instructor?.name || "SmartLearn"}</p></div>{staff && <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${course.published ? "bg-emerald-300/20 text-emerald-50" : "bg-amber-200/20 text-amber-50"}`}>{course.published ? "Published" : "Draft"}</span>}</div></div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(270px,.8fr)]"><div className="p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">Course content</h3><p className="mt-1 text-sm text-slate-500">{totalLessons} lessons · {assignments.length} assignments</p></div>{staff && <button onClick={() => setShowEditing(!showEditing)} className={secondary}><Settings2 size={15}/>{showEditing ? "Hide studio" : "Open course studio"}</button>}</div>
        {staff && showEditing && <CourseEditor course={course} user={user} teachers={teachers} onAction={onAction} actions={actions}/>}
        {!enrolled && !staff ? <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><h4 className="font-bold text-indigo-950">Enroll to unlock this course</h4><p className="mt-1 text-sm text-indigo-800">Join the course to open lessons, track progress, and submit assignments.</p><button onClick={() => onAction(() => actions.enroll(course._id).unwrap(), "You are enrolled. Refreshing course content...")} className={button + " mt-4"}>Enroll in this course</button></div> : lessons.length ? <div className="mt-5 space-y-3">{lessons.map((lesson, index) => staff ? <StaffLessonItem key={lesson._id} courseId={course._id} lesson={lesson} index={index} completed={completedIds.has(lesson._id)} onAction={onAction} updateLesson={actions.updateLesson} deleteLesson={actions.deleteLesson}/> : <LessonItem key={lesson._id} lesson={lesson} index={index} completed={completedIds.has(lesson._id)} canComplete={enrolled} markComplete={() => onAction(() => actions.completeLesson({id:course._id,lessonId:lesson._id}).unwrap(), "Lesson marked complete.")}/>)}</div> : <EmptyState icon={BookOpen} title="No lessons published yet" text={staff ? "Use the course studio to add the first lesson." : "Your teacher is preparing the course content."}/>}</div>
        <aside className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-8 lg:border-l lg:border-t-0"><div className="rounded-2xl border border-slate-200/80 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{staff ? "Course snapshot" : "Your progress"}</p>{!staff && <><div className="mt-3 flex items-end justify-between"><span className="text-3xl font-bold">{totalLessons ? Math.round(done / totalLessons * 100) : 0}%</span><span className="pb-1 text-xs text-slate-500">{done} of {totalLessons} lessons</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{width:`${totalLessons ? Math.min(done / totalLessons * 100,100) : 0}%`}}/></div></>}
            <div className="mt-4 grid grid-cols-2 gap-3"><MiniMetric label="Lessons" value={totalLessons}/><MiniMetric label="Assignments" value={assignments.length}/>{staff && <MiniMetric label="Enrolled learners" value={roster.length}/>}</div>
          </div><div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5"><h4 className="font-bold">Assignments</h4>{assignments.length ? <div className="mt-3 space-y-2">{assignments.slice(0, 4).map((assignment) => <button type="button" key={assignment._id} onClick={() => openAssignment(assignment)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-indigo-50"><div className="min-w-0"><p className="truncate text-sm font-semibold">{assignment.title}</p><p className="text-xs text-slate-500">{assignment.dueDate ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}` : "No due date"}</p></div><ChevronRight size={15} className="shrink-0 text-slate-400"/></button>)}<button onClick={openAssignments} className="mt-1 text-sm font-semibold text-indigo-700">Open assignments <ArrowRight size={14} className="ml-1 inline"/></button></div> : <p className="mt-2 text-sm text-slate-500">No assignments for this course yet.</p>}</div></aside></div></div>
  </section>;
}

function CourseExtras({ course, user, onAction, actions }) {
  const staff = user.role === "teacher" || user.role === "admin";
  const enrolled = (user.enrolledCourses || []).some((id) => String(id._id || id) === course._id);
  const canJoinDiscussion = staff || enrolled;
  const [sendMessage] = useSendCourseMessageMutation();
  const { data: messageData } = useCourseMessagesQuery(course._id, { skip: !canJoinDiscussion });
  const messages = messageData?.messages || [];
  const [messageText, setMessageText] = useState("");
  const resources = course.resources || [];
  const quizzes = course.quizzes || [];
  const announcements = course.announcements || [];
  const upload = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    onAction(() => actions.uploadResource({ id: course._id, body }).unwrap(), "File added to course resources.");
    form.reset();
  };
  return <div className="mt-6 grid gap-5 xl:grid-cols-2">
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5"><PageHeading title="Resources" description="Download course handouts and reference files."/>{resources.length ? <div className="space-y-2">{resources.map((resource) => <div key={resource._id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><BookOpen size={18} className="shrink-0 text-indigo-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{resource.title}</p><p className="truncate text-xs text-slate-500">{resource.originalName} · {(resource.size / 1024 / 1024).toFixed(1)} MB</p></div><a href={`${apiOrigin}/api/v1/resources/${resource._id}/download`} className={secondary}>Download</a>{staff && <button onClick={() => onAction(() => actions.deleteResource({ id: course._id, resourceId: resource._id }).unwrap(), "Resource deleted.")} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Remove resource"><X size={16}/></button>}</div>)}</div> : <p className="text-sm text-slate-500">Course materials will appear here.</p>}{staff && <form onSubmit={upload} className="mt-4 space-y-2 border-t border-slate-100 pt-4"><h4 className="text-sm font-bold">Upload a resource</h4><input name="title" placeholder="Display title (optional)" className={field}/><input name="file" required type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp" className={field}/><p className="text-xs text-slate-400">PDF, Office, text, CSV, and image files · 20 MB limit</p><button className={secondary}><Plus size={15}/> Upload file</button></form>}</section>

    <section className="rounded-2xl border border-slate-200/80 bg-white p-5"><PageHeading title="Knowledge checks" description="Practice key ideas and get your score immediately."/>{quizzes.length ? <div className="space-y-3">{quizzes.map((quiz) => <div key={quiz._id} className="rounded-xl bg-slate-50 p-4">{staff && <div className="mb-2 flex justify-end"><button onClick={() => onAction(() => actions.updateQuiz({ id: quiz._id, published: !quiz.published }).unwrap(), quiz.published ? "Quiz unpublished." : "Quiz published.")} className={secondary}>{quiz.published ? "Unpublish" : "Publish quiz"}</button></div>}<QuizCard quiz={quiz} onAttempt={(answers) => actions.submitQuizAttempt({ id: quiz._id, answers }).unwrap()} onAction={onAction}/></div>)}</div> : <p className="text-sm text-slate-500">No quizzes have been added yet.</p>}{!staff && !enrolled && <p className="mt-3 text-xs text-slate-500">Enroll in the course to take its quizzes.</p>}{staff && <QuizBuilder courseId={course._id} createQuiz={actions.createQuiz} onAction={onAction}/>}</section>

    {staff && <section className="rounded-2xl border border-slate-200/80 bg-white p-5"><PageHeading title="Course announcements" description="Share important updates with enrolled learners."/><form onSubmit={(event) => {event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));onAction(() => actions.createAnnouncement({courseId:course._id,...values}).unwrap(),"Announcement posted.");form.reset();}} className="space-y-2"><input required name="title" placeholder="Announcement title" className={field}/><textarea required name="body" rows="3" placeholder="Write your update" className={field}/><button className={button}><Plus size={15}/> Post announcement</button></form></section>}

    <section className="rounded-2xl border border-slate-200/80 bg-white p-5"><PageHeading title="Course discussion" description="Ask questions and talk with your learning group."/><div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">{messages.length ? messages.map((message) => <article key={message._id} className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-indigo-700">{message.sender?.name} <span className="font-normal capitalize text-slate-400">· {message.sender?.role}</span></p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p><time className="mt-2 block text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</time></article>) : <p className="p-6 text-center text-sm text-slate-500">{canJoinDiscussion ? "Start a course discussion." : "Enroll to join the discussion."}</p>}</div>{canJoinDiscussion && <form onSubmit={(event) => {event.preventDefault();onAction(() => sendMessage({courseId:course._id,body:messageText}).unwrap(),"Message sent.");setMessageText("");}} className="mt-3 flex gap-2"><input required maxLength="5000" value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message" className={field}/><button className={button}>Send</button></form>}</section>

    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2"><PageHeading title="Announcements" description="Recent course updates."/>{announcements.length ? <div className="grid gap-3 md:grid-cols-2">{announcements.map((announcement) => <article key={announcement._id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h4 className="font-bold">{announcement.title}</h4><time className="shrink-0 text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleDateString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p><p className="mt-3 text-xs text-slate-400">{announcement.author?.name}</p></article>)}</div> : <p className="text-sm text-slate-500">There are no updates yet.</p>}</section>
  </div>;
}

function QuizBuilder({ courseId, createQuiz, onAction }) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState([{ prompt: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }]);
  const updateQuestion = (index, update) => setQuestions(questions.map((question, i) => i === index ? { ...question, ...update } : question));
  const submit = (event) => {
    event.preventDefault();
    onAction(() => createQuiz({ courseId, title, instructions, questions }).unwrap(), "Quiz saved as a draft. Publish it when ready.");
    setTitle(""); setInstructions(""); setQuestions([{ prompt: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }]);
  };
  return <details className="mt-4 rounded-xl border border-indigo-100 bg-white p-4"><summary className="cursor-pointer text-sm font-bold text-indigo-700">Create a quiz</summary><form onSubmit={submit} className="mt-4 space-y-4"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Quiz title" className={field}/><input value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Instructions (optional)" className={field}/>{questions.map((question,index) => <fieldset key={index} className="space-y-2 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-xs font-bold">Question {index+1}</legend><input required value={question.prompt} onChange={(event) => updateQuestion(index,{prompt:event.target.value})} placeholder="Question prompt" className={field}/><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex items-center gap-2"><input type="radio" name={`correct-${index}`} checked={question.answerIndex===optionIndex} onChange={() => updateQuestion(index,{answerIndex:optionIndex})}/><input required value={option} onChange={(event) => updateQuestion(index,{options:question.options.map((item,i)=>i===optionIndex?event.target.value:item)})} placeholder={`Choice ${optionIndex+1}`} className={field}/></label>)}</div><input value={question.explanation} onChange={(event) => updateQuestion(index,{explanation:event.target.value})} placeholder="Answer explanation (optional)" className={field}/></fieldset>)}<div className="flex flex-wrap gap-2"><button type="button" disabled={questions.length>=50} onClick={() => setQuestions([...questions,{prompt:"",options:["","","",""],answerIndex:0,explanation:""}])} className={secondary}><Plus size={15}/> Add question</button>{questions.length>1 && <button type="button" onClick={() => setQuestions(questions.slice(0,-1))} className={secondary}>Remove last question</button>}<button className={button}>Save quiz draft</button></div><p className="text-xs text-slate-400">Students only receive the answer key after they submit.</p></form></details>;
}

function QuizCard({ quiz, onAttempt, onAction }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const { data } = useQuizAttemptsQuery(quiz._id);
  const attempts = data?.attempts || [];
  const submit = async (event) => {
    event.preventDefault();
    const response = await onAction(() => onAttempt(quiz.questions.map((_,index) => Number(answers[index]))), "Quiz submitted.");
    if (response?.results) setResult(response);
  };
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-bold">{quiz.title}</h4>{quiz.instructions && <p className="mt-1 text-sm text-slate-500">{quiz.instructions}</p>}{attempts.length > 0 && <p className="mt-2 text-xs text-slate-500">Best score: {Math.max(...attempts.map((attempt) => attempt.score))}% · {attempts.length} attempt{attempts.length===1?"":"s"}</p>}<form onSubmit={submit} className="mt-3 space-y-3">{quiz.questions.map((question,index) => <fieldset key={question._id} className="rounded-lg bg-slate-50 p-3"><legend className="text-sm font-semibold">{index+1}. {question.prompt}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{question.options.map((option,optionIndex) => <label key={optionIndex} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-2 text-sm"><input required type="radio" name={`quiz-${quiz._id}-${index}`} checked={Number(answers[index])===optionIndex} onChange={() => setAnswers({...answers,[index]:optionIndex})}/>{option}</label>)}</div></fieldset>)}<button className={button}>Submit quiz</button></form>{result && <div className="mt-3 rounded-lg bg-indigo-50 p-3"><p className="font-bold">Score: {result.attempt.score}%</p><div className="mt-2 space-y-1">{result.results.map((item,index) => <p key={index} className={`text-xs ${item.correct?"text-emerald-700":"text-rose-700"}`}>{item.correct?"Correct":"Review"}: {item.prompt}{item.explanation && <span className="block text-slate-500">{item.explanation}</span>}</p>)}</div></div>}</div>;
}

function LessonItem({ lesson, index, completed, canComplete, markComplete }) {
  const [expanded, setExpanded] = useState(index === 0);
  return <article className={`overflow-hidden rounded-2xl border ${completed ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white"}`}><button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 p-4 text-left"><span className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{completed ? <Check size={17}/> : String(index + 1).padStart(2,"0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{lesson.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{lesson.moduleTitle && lesson.moduleTitle !== "Course lessons" ? `${lesson.moduleTitle} · ` : ""}{completed ? "Completed" : lesson.videoUrl ? "Video and lesson" : "Reading lesson"}</span></span><ChevronRight size={17} className={`shrink-0 text-slate-400 transition ${expanded ? "rotate-90" : ""}`}/></button>{expanded && <div className="border-t border-slate-100 px-4 pb-4 pl-[68px]"><p className="whitespace-pre-wrap pt-3 text-sm leading-6 text-slate-600">{lesson.content || lesson.description || "Your instructor has not added lesson notes."}</p>{lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><Video size={16}/> Watch lesson video <ArrowRight size={14}/></a>}{canComplete && <div className="mt-4">{completed ? <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17}/> Lesson completed</span> : <button onClick={markComplete} className={button}><Check size={15}/> Mark lesson complete</button>}</div>}</div>}</article>;
}

function StaffLessonItem({ courseId, lesson, index, completed, onAction, updateLesson, deleteLesson }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    title: lesson.title || "",
    moduleTitle: lesson.moduleTitle || "",
    description: lesson.description || "",
    content: lesson.content || "",
    videoUrl: lesson.videoUrl || "",
    order: lesson.order ?? index,
  });
  const save = (event) => {
    event.preventDefault();
    onAction(() => updateLesson({ id: courseId, lessonId: lesson._id, ...values, order: Number(values.order) }).unwrap(), "Lesson updated.")
      .then((result) => { if (result) setEditing(false); });
  };
  const remove = () => {
    if (window.confirm(`Delete the lesson “${lesson.title}”? Student completion for this lesson will also be removed.`)) {
      onAction(() => deleteLesson({ id: courseId, lessonId: lesson._id }).unwrap(), "Lesson deleted.");
    }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={() => setEditing(!editing)} className={secondary + " px-3 py-2 text-xs"}>{editing ? "Cancel edit" : "Edit lesson"}</button>
      <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Delete lesson</button>
    </div>
    {editing && <form onSubmit={save} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold">Lesson title<input required maxLength="160" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold">Module or unit<input value={values.moduleTitle} onChange={(event) => setValues({ ...values, moduleTitle: event.target.value })} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold">Display order<input type="number" min="0" step="1" value={values.order} onChange={(event) => setValues({ ...values, order: event.target.value })} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold">Video URL<input type="url" value={values.videoUrl} onChange={(event) => setValues({ ...values, videoUrl: event.target.value })} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold sm:col-span-2">Description<textarea rows="2" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold sm:col-span-2">Lesson content<textarea rows="4" value={values.content} onChange={(event) => setValues({ ...values, content: event.target.value })} className={field + " mt-1.5"}/></label>
      <div className="flex gap-2 sm:col-span-2"><button className={button}>Save lesson</button><button type="button" onClick={() => setEditing(false)} className={secondary}>Cancel</button></div>
    </form>}
    <LessonItem lesson={lesson} index={index} completed={completed} canComplete={false}/>
  </div>;
}

function CourseEditor({ course, user, teachers, onAction, actions }) {
  const [lesson, setLesson] = useState({ title: "", moduleTitle: "", content: "", videoUrl: "" });
  const [assignment, setAssignment] = useState({ title: "", description: "", dueDate: "" });
  const [assignmentQuestions, setAssignmentQuestions] = useState([{ prompt: "", answerType: "long" }]);
  const saveDetails = (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); onAction(() => actions.updateCourse({id:course._id,...values}).unwrap(), "Course details saved."); };
  const addCourseLesson = (event) => { event.preventDefault(); onAction(() => actions.addLesson({id:course._id,...lesson}).unwrap(), "Lesson added to the course."); setLesson({title:"",moduleTitle:"",content:"",videoUrl:""}); };
  const addCourseAssignment = (event) => { event.preventDefault(); onAction(() => actions.createAssignment({courseId:course._id,...assignment,questions:assignmentQuestions}).unwrap(), "Assignment and questions added to the course."); setAssignment({title:"",description:"",dueDate:""}); setAssignmentQuestions([{prompt:"",answerType:"long"}]); };
  return <div className="mt-5 space-y-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5"><form onSubmit={saveDetails} className="grid gap-3 sm:grid-cols-2"><h4 className="font-bold sm:col-span-2">Course settings</h4><input name="title" required defaultValue={course.title} placeholder="Course title" className={field}/><input name="category" defaultValue={course.category} placeholder="Topic" className={field}/><select name="level" defaultValue={course.level} className={field}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>{user.role === "admin" && <select name="instructorId" defaultValue={course.instructor?._id || ""} className={field}><option value="">Choose a teacher</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name} · {teacher.email}</option>)}</select>}<textarea name="description" required defaultValue={course.description} placeholder="Description" className={field + " sm:col-span-2"}/><button className={secondary + " justify-self-start"}>Save course details</button></form>
    <div className="grid gap-5 border-t border-indigo-100 pt-5 lg:grid-cols-2"><form onSubmit={addCourseLesson} className="space-y-2.5"><h4 className="font-bold">Add a lesson</h4><input value={lesson.moduleTitle} onChange={(event) => setLesson({...lesson,moduleTitle:event.target.value})} placeholder="Module or unit (optional)" className={field}/><input required value={lesson.title} onChange={(event) => setLesson({...lesson,title:event.target.value})} placeholder="Lesson title" className={field}/><textarea value={lesson.content} onChange={(event) => setLesson({...lesson,content:event.target.value})} placeholder="Lesson notes or learning content" rows="3" className={field}/><input type="url" value={lesson.videoUrl} onChange={(event) => setLesson({...lesson,videoUrl:event.target.value})} placeholder="Video URL (optional)" className={field}/><button className={button}><Plus size={15}/> Add lesson</button></form>
      <form onSubmit={addCourseAssignment} className="space-y-2.5"><h4 className="font-bold">Create an assignment</h4><input required value={assignment.title} onChange={(event) => setAssignment({...assignment,title:event.target.value})} placeholder="Assignment title" className={field}/><textarea required value={assignment.description} onChange={(event) => setAssignment({...assignment,description:event.target.value})} placeholder="Instructions and requirements" rows="3" className={field}/><label className="block text-xs font-semibold text-slate-500">Due date (optional)</label><input type="date" value={assignment.dueDate} onChange={(event) => setAssignment({...assignment,dueDate:event.target.value})} className={field}/><div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"><div><h5 className="text-sm font-bold">Questions or tasks</h5><p className="mt-1 text-xs text-slate-500">Add what the student must answer or complete.</p></div>{assignmentQuestions.map((question,index)=><fieldset key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_140px]"><legend className="px-1 text-xs font-semibold text-slate-600">Question or task {index+1}</legend><textarea required maxLength="2000" rows="2" value={question.prompt} onChange={(event)=>setAssignmentQuestions(assignmentQuestions.map((item,i)=>i===index?{...item,prompt:event.target.value}:item))} placeholder="Write the question or describe the task" className={field+" sm:col-span-2"}/><select value={question.answerType} onChange={(event)=>setAssignmentQuestions(assignmentQuestions.map((item,i)=>i===index?{...item,answerType:event.target.value}:item))} aria-label={`Answer format for question or task ${index+1}`} className={field}><option value="long">Long response</option><option value="short">Short answer</option></select>{assignmentQuestions.length>1&&<button type="button" onClick={()=>setAssignmentQuestions(assignmentQuestions.filter((_,i)=>i!==index))} className="text-left text-xs font-semibold text-rose-700">Remove this question</button>}</fieldset>)}<button type="button" disabled={assignmentQuestions.length>=30} onClick={()=>setAssignmentQuestions([...assignmentQuestions,{prompt:"",answerType:"long"}])} className={secondary+" w-full"}><Plus size={15}/> Add question or task</button></div><button className={button}><Plus size={15}/> Add assignment</button></form></div>
    <div className="flex flex-wrap gap-2 border-t border-indigo-100 pt-4"><button onClick={() => onAction(() => actions.updateCourse({id:course._id,published:!course.published}).unwrap(), course.published ? "Course unpublished." : "Course published.")} className={secondary}>{course.published ? "Unpublish course" : "Publish course"}</button><button onClick={() => {if(window.confirm("Delete this course and its assignments?")) onAction(() => actions.deleteCourse(course._id).unwrap(), "Course deleted.");}} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete course</button></div>
  </div>;
}

function NewCourseForm({ creating, onCreate, teachers = [] }) {
  return <form onSubmit={onCreate} className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5"><div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Plus size={19}/></span><div><h3 className="font-bold">Create a course</h3><p className="mt-0.5 text-xs text-slate-500">Start a new learning experience.</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><input name="title" required placeholder="Course title" className={field}/><input name="category" placeholder="Topic or category" className={field}/><select name="level" className={field}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>{teachers.length > 0 && <select name="instructorId" className={field}><option value="">Keep me as course owner</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}</select>}<textarea name="description" required placeholder="What will learners learn?" className={field + " sm:col-span-2 xl:col-span-3"}/><button disabled={creating} className={button + " self-start"}>{creating ? "Creating..." : <><Plus size={15}/> Create course</>}</button></div></form>;
}

function TeacherCourses({ courses, loading, error, creating, onCreate, openCourse }) {
  return <section className="mt-7"><PageHeading eyebrow="Teaching workspace" title="My courses" description="Build content, set assignments, and publish when you are ready."/><NewCourseForm creating={creating} onCreate={onCreate}/>{loading ? <Loading/> : error ? <EmptyState icon={CircleHelp} title="Could not load courses" text="Check the API connection and reload."/> : courses.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course,index) => <CourseTile key={course._id} course={course} index={index} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="Your course studio is empty" text="Create your first course above, then add lessons and publish it."/>}</section>;
}

function AdminCourses({ courses, teachers, loading, error, creating, onCreate, openCourse }) {
  return <section className="mt-7"><PageHeading eyebrow="Platform management" title="Courses" description="Review all courses, publication status, and learning content."/><NewCourseForm creating={creating} onCreate={onCreate} teachers={teachers}/>{loading ? <Loading/> : error ? <EmptyState icon={CircleHelp} title="Could not load courses" text="Check the API connection and reload."/> : courses.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course,index) => <CourseTile key={course._id} course={course} index={index} onOpen={() => openCourse(course)}/>)}</div> : <EmptyState icon={BookOpen} title="No courses yet" text="Create a course and select a teacher account to manage it."/>}</section>;
}

function AssignmentsPage({ user, assignments, loading, onAction, submit, grade, updateAssignment, deleteAssignment, gradedOnly, focusedAssignmentId, onClearFocus }) {
  const [filter, setFilter] = useState("All work");
  const own = user.role === "student";
  const filtered = assignments.filter((assignment) => {
    if (focusedAssignmentId && assignment._id !== focusedAssignmentId) return false;
    const mine = assignment.submissions?.[0];
    if (gradedOnly) return mine?.grade !== null && mine?.grade !== undefined;
    if (!own && filter === "Needs grading") return assignment.submissions?.some((submission) => submission.grade === null || submission.grade === undefined);
    if (own && filter === "Not submitted") return !mine;
    if (own && filter === "Submitted") return Boolean(mine);
    return true;
  });
  const filters = own ? ["All work", "Not submitted", "Submitted"] : ["All work", "Needs grading"];
  return <section className="mt-7"><PageHeading eyebrow={own ? "Your coursework" : "Learner work"} title={focusedAssignmentId ? "Assignment details" : gradedOnly ? "Grades" : own ? "Assignments" : "Assignments and grading"} description={own ? "Open an assignment, answer its questions, and submit your work." : "Review submissions from your enrolled learners."} action={focusedAssignmentId&&<button onClick={onClearFocus} className={secondary}>Back to all assignments</button>}/>{!gradedOnly&&!focusedAssignmentId&&<div className="mb-5 flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>}{loading ? <Loading/> : filtered.length ? <div className="grid gap-4 xl:grid-cols-2">{filtered.map((assignment) => <AssignmentCard key={assignment._id} assignment={assignment} user={user} onAction={onAction} submit={submit} grade={grade} updateAssignment={updateAssignment} deleteAssignment={deleteAssignment}/>)}</div> : focusedAssignmentId ? <EmptyState icon={CircleHelp} title="Assignment unavailable" text="This assignment may have been removed or is no longer in your courses." action={<button onClick={onClearFocus} className={secondary}>Back to all assignments</button>}/> : <EmptyState icon={gradedOnly ? Award : CheckCircle2} title={gradedOnly ? "No grades yet" : "You are all caught up"} text={gradedOnly ? "Grades and teacher feedback will appear here after your submissions are reviewed." : own ? "Your courses do not have any assignments in this view." : "There are no submissions waiting in this view."}/>}</section>;
}

function SchedulePage({ assignments, user, loading, openAssignment }) {
  const [view, setView] = useState("Upcoming");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = assignments.filter((assignment) => !assignment.dueDate || new Date(assignment.dueDate) >= startOfToday);
  const past = assignments.filter((assignment) => assignment.dueDate && new Date(assignment.dueDate) < startOfToday);
  const events = view === "Upcoming" ? upcoming : past;
  const byDate = events.reduce((groups, assignment) => {
    const key = assignment.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : "No due date";
    (groups[key] ||= []).push(assignment);
    return groups;
  }, {});

  return (
    <section className="mt-7 min-w-0">
      <PageHeading eyebrow="Planner" title="Schedule" description={user.role === "student" ? "Track upcoming work from your courses." : "Review assignment due dates and learner work."} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[{ label: "Upcoming", count: upcoming.length }, { label: "Past due", count: past.length }].map(({ label, count }) => (
          <button key={label} type="button" onClick={() => setView(label)} aria-pressed={view === label}
            className={"inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " + (view === label ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-400")}>
            <span>{label}</span>
            <span className={"rounded-full px-2 py-0.5 text-xs " + (view === label ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? <Loading /> : Object.keys(byDate).length ? (
        <div className="min-w-0 space-y-5">
          {Object.entries(byDate).map(([date, items]) => (
            <section key={date} className="min-w-0">
              <h3 className="mb-2 text-sm font-bold text-slate-700">{date}</h3>
              <div className="w-full min-w-0 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                {items.map((assignment) => {
                  const submissionCount = assignment.submissions?.length || 0;
                  const hasSubmitted = submissionCount > 0;
                  const status = user.role === "student"
                    ? (hasSubmitted ? "Submitted" : "To do")
                    : (hasSubmitted ? String(submissionCount) + " submission" + (submissionCount === 1 ? "" : "s") + ": open for review" : "Awaiting learner work");
                  return (
                    <button type="button" key={assignment._id} onClick={() => openAssignment(assignment)}
                      className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left transition hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-slate-900">{assignment.title}</span>
                        <span className="mt-1 block truncate text-sm text-slate-500">{assignment.course?.title || "Course"}</span>
                      </span>
                      <span className={"max-w-[45%] shrink-0 rounded-full px-3 py-1 text-right text-xs font-semibold " + (hasSubmitted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{status}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon={Clock3} title={view === "Upcoming" ? "Nothing scheduled" : "No past due work"}
          text={view === "Upcoming" ? "Assignment dates from your enrolled courses will show here." : "You have no overdue assignments in your courses."} />
      )}
    </section>
  );
}

function AnnouncementsPage({ announcements, loading, isStaff, user, courses, onAction, createAnnouncement, updateAnnouncement, deleteAnnouncement }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || "");
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    onAction(() => createAnnouncement(body).unwrap(), "Announcement posted.");
    form.reset();
  };

  return (
    <section className="mt-7">
      <PageHeading eyebrow="Course updates" title="Announcements" description="Important news and updates from your courses." />
      {isStaff && <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 sm:grid-cols-2">
        <h3 className="font-bold sm:col-span-2">Post an announcement</h3>
        <select required name="courseId" value={courseId} onChange={(event) => setCourseId(event.target.value)} className={field}>
          {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
        </select>
        <input required name="title" maxLength="160" placeholder="Headline" className={field} />
        <textarea required name="body" maxLength="10000" placeholder="Write your update" className={field + " sm:col-span-2"} />
        <button disabled={!courses.length} className={button + " sm:col-span-2 sm:justify-self-start"}><Plus size={15}/> Publish announcement</button>
      </form>}
      {loading ? <Loading /> : announcements.length ? (
        <div className="space-y-3">
          {announcements.map((announcement) => <AnnouncementCard key={announcement._id} announcement={announcement} user={user} isStaff={isStaff} onAction={onAction} updateAnnouncement={updateAnnouncement} deleteAnnouncement={deleteAnnouncement} />)}
        </div>
      ) : <EmptyState icon={Sparkles} title="No announcements" text="Course announcements will appear here when instructors post them." />}
    </section>
  );
}

function AnnouncementCard({ announcement, user, isStaff, onAction, updateAnnouncement, deleteAnnouncement }) {
  const isOwner = user.role === "admin" || String(announcement.author?._id || announcement.author) === String(user._id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const save = (event) => {
    event.preventDefault();
    onAction(() => updateAnnouncement({ id: announcement._id, title, body }).unwrap(), "Announcement updated.")
      .then((result) => { if (result) setEditing(false); });
  };
  const remove = () => {
    if (window.confirm("Delete this announcement? This cannot be undone.")) {
      onAction(() => deleteAnnouncement(announcement._id).unwrap(), "Announcement deleted.");
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{announcement.course?.title}</p>
          {editing ? <form onSubmit={save} className="mt-3 grid w-full gap-3">
            <input required maxLength="160" value={title} onChange={(event) => setTitle(event.target.value)} className={field} aria-label="Announcement title" />
            <textarea required maxLength="10000" rows="4" value={body} onChange={(event) => setBody(event.target.value)} className={field} aria-label="Announcement content" />
            <div className="flex flex-wrap gap-2">
              <button className={button}>Save announcement</button>
              <button type="button" onClick={() => { setTitle(announcement.title); setBody(announcement.body); setEditing(false); }} className={secondary}>Cancel</button>
            </div>
          </form> : <>
            <h3 className="mt-1 text-lg font-bold">{announcement.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p>
          </>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <time className="text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleString()}</time>
          {isStaff && isOwner && <>
            {!editing && <button type="button" onClick={() => setEditing(true)} className={secondary + " px-2.5 py-2 text-xs"}><Pencil size={14}/>Edit</button>}
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14}/>Delete</button>
          </>}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">Posted by {announcement.author?.name}</p>
    </article>
  );
}

function AssignmentCard({ assignment, user, onAction, submit, grade, updateAssignment, deleteAssignment }) {
  const mine = assignment.submissions?.find((submission) => String(submission.student?._id || submission.student) === String(user._id));
  const [text, setText] = useState(mine?.text || "");
  const [answers, setAnswers] = useState(() => Object.fromEntries((mine?.answers || []).map((answer) => [String(answer.questionId), answer.answer])));
  const [editing, setEditing] = useState(!mine);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const teacher = user.role === "teacher" || user.role === "admin";
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{assignment.course?.title || "Course assignment"}</p><h3 className="mt-1 text-lg font-bold">{assignment.title}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${assignment.dueDate && new Date(assignment.dueDate) < new Date() ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{assignment.dueDate ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}` : "No due date"}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{assignment.description}</p>
    {teacher && <AssignmentManagement assignment={assignment} onAction={onAction} updateAssignment={updateAssignment} deleteAssignment={deleteAssignment}/>}
    {!teacher && <div className="mt-4">{mine && !editing ? <div className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">Submitted {new Date(mine.submittedAt).toLocaleDateString()}</span><div className="flex items-center gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">{mine.grade === null || mine.grade === undefined ? "Awaiting review" : `${mine.grade} / 100`}</span><button type="button" onClick={()=>setEditing(true)} className={secondary+" px-2.5 py-1.5 text-xs"}>Edit response</button></div></div>{(assignment.questions||[]).map((question,index)=>{const response=mine.answers?.find((answer)=>String(answer.questionId)===String(question._id));return <div key={question._id} className="mt-3"><p className="text-xs font-bold text-slate-500">{index+1}. {question.prompt}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{response?.answer||"No response"}</p></div>;})}{mine.text&&<p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{mine.text}</p>}{mine.resource && <a className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:underline" href={`${apiOrigin}/api/v1/resources/${mine.resource._id || mine.resource}/download`}>Download attached file</a>}{mine.feedback && <p className="mt-3 rounded-lg border-l-2 border-indigo-400 bg-indigo-50 px-3 py-2 text-sm text-indigo-900"><strong>Teacher feedback:</strong> {mine.feedback}</p>}</div> : <form onSubmit={(event) => {event.preventDefault();const form=event.currentTarget;const body=new FormData(form);body.set("answers",JSON.stringify((assignment.questions||[]).map((question)=>({questionId:question._id,answer:answers[question._id]||""}))));onAction(() => submit({id:assignment._id,body}).unwrap(),"Assignment submitted.").then((result)=>{if(result)setEditing(false);});}} className="space-y-3"><p className="text-xs font-semibold text-slate-600">{assignment.questions?.length ? "Answer each question or task" : "Write your response to the task or attach completed work"}</p>{(assignment.questions||[]).map((question,index)=><label key={question._id} className="block rounded-xl border border-slate-200 p-3"><span className="text-sm font-semibold">{index+1}. {question.prompt}</span>{question.answerType==="short"?<input required maxLength="20000" value={answers[question._id]||""} onChange={(event)=>setAnswers({...answers,[question._id]:event.target.value})} placeholder="Your short answer" className={field+" mt-2"}/>:<textarea required maxLength="20000" rows="3" value={answers[question._id]||""} onChange={(event)=>setAnswers({...answers,[question._id]:event.target.value})} placeholder="Write your answer or explain how you completed the task" className={field+" mt-2"}/>}</label>)}<label className="block text-xs font-semibold text-slate-600">{assignment.questions?.length ? "Additional notes (optional)" : "Your response (optional if attaching a file)"}<textarea name="text" rows="3" value={text} onChange={(event) => setText(event.target.value)} placeholder={assignment.questions?.length ? "Add any notes for your teacher" : "Write your response here"} className={field+" mt-2"}/></label><label className="block text-xs font-semibold text-slate-600">Attach your completed work (optional)<input name="file" type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp" className={field+" mt-2"}/><span className="mt-1 block text-xs font-normal text-slate-400">Images (PNG, JPG, WebP), PDF, Office, text or CSV · max 20 MB</span></label><button className={button}>{mine ? "Update submission" : "Submit assignment"} <ArrowRight size={15}/></button></form>}</div>}
    {teacher && <div className="mt-4 space-y-3">{assignment.submissions?.length ? assignment.submissions.map((submission) => <div key={submission._id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{submission.student?.name || "Learner"}</p><p className="text-xs text-slate-500">{submission.student?.email} · submitted {new Date(submission.submittedAt).toLocaleDateString()}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">{submission.grade === null || submission.grade === undefined ? "Needs review" : `${submission.grade} / 100`}</span></div>{(assignment.questions||[]).map((question,index)=>{const response=submission.answers?.find((answer)=>String(answer.questionId)===String(question._id));return <div key={question._id} className="mt-3 rounded-lg bg-white p-3"><p className="text-xs font-bold text-slate-500">{index+1}. {question.prompt}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{response?.answer||"No response"}</p></div>;})}{submission.text&&<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.text}</p>}{submission.resource && <a className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:underline" href={`${apiOrigin}/api/v1/resources/${submission.resource._id || submission.resource}/download`}>Download learner attachment</a>}<form onSubmit={(event) => {event.preventDefault();onAction(() => grade({id:assignment._id,submissionId:submission._id,grade:gradeValue === "" ? submission.grade : gradeValue,feedback}).unwrap(),"Grade and feedback saved.");}} className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr_auto]"><input required type="number" min="0" max="100" value={gradeValue || submission.grade || ""} onChange={(event) => setGradeValue(event.target.value)} placeholder="Score / 100" aria-label="Score out of 100" className={field}/><input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder={submission.feedback || "Feedback for learner"} aria-label="Feedback" className={field}/><button className={secondary}>Save review</button></form></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No submissions yet.</p>}</div>}
  </article>;
}

function AssignmentManagement({ assignment, onAction, updateAssignment, deleteAssignment }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [dueDate, setDueDate] = useState(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 10) : "");
  const hasSubmissions = Boolean(assignment.submissions?.length);
  const save = (event) => {
    event.preventDefault();
    onAction(() => updateAssignment({ id: assignment._id, title, description, dueDate }).unwrap(), "Assignment updated.")
      .then((result) => { if (result) setEditing(false); });
  };
  const remove = () => {
    if (hasSubmissions) return;
    if (window.confirm("Delete this assignment? This cannot be undone.")) {
      onAction(() => deleteAssignment(assignment._id).unwrap(), "Assignment deleted.");
    }
  };
  return <div className="mt-4 border-t border-slate-100 pt-3">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setEditing(!editing)} className={secondary + " px-3 py-2 text-xs"}>{editing ? "Cancel edit" : <><Pencil size={14}/>Edit assignment</>}</button>
      <button type="button" disabled={hasSubmissions} onClick={remove} title={hasSubmissions ? "Assignments with submissions are retained to protect student work and grades." : "Delete assignment"} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14}/>Delete assignment</button>
      {hasSubmissions && <span className="text-xs text-slate-500">Student submissions and grades are protected from deletion.</span>}
    </div>
    {editing && <form onSubmit={save} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="text-xs font-semibold">Assignment title<input required maxLength="160" value={title} onChange={(event) => setTitle(event.target.value)} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold">Instructions<textarea required maxLength="10000" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} className={field + " mt-1.5"}/></label>
      <label className="text-xs font-semibold">Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={field + " mt-1.5"}/><span className="mt-1 block font-normal text-slate-500">Leave blank if there is no due date.</span></label>
      <button className={button + " justify-self-start"}>Save assignment</button>
    </form>}
  </div>;
}

function GradesPage({ assignments, loading }) {
  const results = assignments.flatMap((assignment) => (assignment.submissions || []).filter((submission) => submission.grade !== null && submission.grade !== undefined).map((submission) => ({assignment, submission})));
  return <section className="mt-7"><PageHeading eyebrow="Academic record" title="Grades and feedback" description="A clear record of your reviewed assignments."/>{loading ? <Loading/> : results.length ? <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="grid grid-cols-[1.3fr_1fr_100px] gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Assignment</span><span>Course and feedback</span><span>Score</span></div>{results.map(({assignment,submission}) => <div key={submission._id} className="grid grid-cols-[1.3fr_1fr_100px] items-start gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><div><p className="font-semibold">{assignment.title}</p><p className="mt-1 text-xs text-slate-500">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p></div><div><p className="text-sm text-slate-600">{assignment.course?.title}</p>{submission.feedback && <p className="mt-1 text-xs leading-5 text-slate-500">{submission.feedback}</p>}</div><span className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${submission.grade >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{submission.grade}/100</span></div>)}</div> : <EmptyState icon={Award} title="Your gradebook is waiting" text="Once your teacher reviews an assignment, the score and feedback will appear here."/>}</section>;
}

function LearnersPage({ learners, courses, loading, openCourse }) {
  return <section className="mt-7"><PageHeading eyebrow="Teaching workspace" title="Learners" description="See who has enrolled and follow their course progress."/>{loading ? <Loading/> : learners.length ? <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="grid grid-cols-[1.4fr_1fr_130px_130px] gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Learner</span><span>Course</span><span>Progress</span><span>Enrolled</span></div>{learners.map((learner) => <div key={`${learner._id}-${learner.courseId}`} className="grid grid-cols-[1.4fr_1fr_130px_130px] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><Avatar name={learner.name} className="size-9 text-xs"/><div className="min-w-0"><p className="truncate text-sm font-semibold">{learner.name}</p><p className="truncate text-xs text-slate-500">{learner.email}</p></div></div><button onClick={() => {const course = courses.find((item) => item._id === learner.courseId);if(course) openCourse(course);}} className="truncate text-left text-sm font-medium text-indigo-700 hover:underline">{learner.courseTitle}</button><span className="text-sm font-semibold">{learner.completedLessons}/{learner.totalLessons} lessons</span><span className="text-xs text-slate-500">{new Date(learner.enrolledAt).toLocaleDateString()}</span></div>)}</div> : <EmptyState icon={Users} title="No learners yet" text="Learners will appear after they enroll in one of your published courses."/>}</section>;
}

function PeoplePage({ users, changeRole, setActive }) {
  const [filter, setFilter] = useState("All roles");
  const shown = users.filter((user) => filter === "All roles" || user.role === filter.toLowerCase());
  return <section className="mt-7"><PageHeading eyebrow="Platform management" title="People and roles" description="Manage access for students, teachers, and administrators."/><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4"><p className="text-sm text-slate-600">{users.length} registered members</p><select value={filter} onChange={(event) => setFilter(event.target.value)} className={field + " max-w-48"}><option>All roles</option><option>Student</option><option>Teacher</option><option>Admin</option></select></div>{shown.length ? <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="hidden grid-cols-[1.4fr_1fr_170px_120px] gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid"><span>Member</span><span>Email</span><span>Role access</span><span>Joined</span></div>{shown.map((person) => <div key={person._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:grid sm:grid-cols-[1.4fr_1fr_170px_120px] sm:px-5"><div className="flex min-w-0 items-center gap-3"><Avatar name={person.name} className="size-9 text-xs"/><span className="truncate text-sm font-semibold">{person.name}</span></div><span className="min-w-0 flex-1 truncate text-sm text-slate-500 sm:order-none">{person.email}</span><div className="flex items-center gap-2"><select value={person.role} onChange={(event) => changeRole(person._id,event.target.value)} aria-label={`Role for ${person.name}`} className={field + " w-36 capitalize"}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select><button onClick={() => setActive(person._id,!person.isActive)} className={person.isActive ? "rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" : "rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"}>{person.isActive ? "Deactivate" : "Activate"}</button></div><span className="hidden text-xs text-slate-500 sm:block">{new Date(person.createdAt).toLocaleDateString()}</span></div>)}</div> : <EmptyState icon={Users} title="No members match this role" text="Choose another filter to see platform members."/>}</section>;
}

function ReportsPage({ courses, users, assignments, learners }) {
  const roleCounts = users.reduce((counts, user) => ({...counts,[user.role]:(counts[user.role]||0)+1}),{});
  const graded = assignments.flatMap((assignment) => (assignment.submissions || []).filter((submission) => submission.grade !== null && submission.grade !== undefined));
  const average = graded.length ? Math.round(graded.reduce((sum, submission) => sum + submission.grade, 0) / graded.length) : 0;
  const topCourses = [...courses].sort((a,b) => (b.enrollmentCount||0) - (a.enrollmentCount||0));
  return <section className="mt-7"><PageHeading eyebrow="Platform management" title="Reports" description="A quick view of course activity and platform participation."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total members" value={users.length} caption={`${roleCounts.student||0} students · ${roleCounts.teacher||0} teachers`} icon={Users}/><StatCard label="Active courses" value={courses.filter((course) => course.published).length} caption={`${courses.length} courses total`} icon={BookOpen} tint="teal"/><StatCard label="Course enrollments" value={learners.length} caption="Learner-course registrations" icon={GraduationCap} tint="violet"/><StatCard label="Average grade" value={graded.length ? `${average}%` : "?"} caption={`${graded.length} graded submissions`} icon={BarChart3} tint="amber"/></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5"><h3 className="font-bold">Course engagement</h3><p className="mt-1 text-sm text-slate-500">Enrollment counts and publication status.</p><div className="mt-4 space-y-3">{topCourses.map((course) => <div key={course._id} className="grid gap-2 sm:grid-cols-[1fr_140px_100px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{course.title}</p><p className="text-xs text-slate-500">{course.instructor?.name || "No instructor"}</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{width:`${Math.min((course.enrollmentCount||0)*10,100)}%`}}/></div><span className="text-xs font-semibold text-slate-600">{course.enrollmentCount||0} learners · {course.published ? "Live" : "Draft"}</span></div>)}</div>{!courses.length && <p className="mt-4 text-sm text-slate-500">Course analytics will appear after courses are created.</p>}</div></section>;
}

function ProfilePage({ user, onAction, updateProfile, changePassword, uploadPhoto, removePhoto, photoBusy }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [photoSelection, setPhotoSelection] = useState(null);
  const [photoError, setPhotoError] = useState("");
  useEffect(() => {
    return () => { if (photoSelection?.preview) URL.revokeObjectURL(photoSelection.preview); };
  }, [photoSelection]);
  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Choose a PNG, JPG, or WebP image."); return; }
    if (file.size > 20 * 1024 * 1024) { setPhotoError("The image must be smaller than 20 MB."); return; }
    setPhotoError("");
    setPhotoSelection({ file, preview: URL.createObjectURL(file) });
  };
  const savePhoto = async () => {
    if (!photoSelection) return;
    const body = new FormData();
    body.append("photo", photoSelection.file);
    const result = await onAction(() => uploadPhoto(body).unwrap(), "Profile photo updated.");
    if (result) setPhotoSelection(null);
  };
  const clearPhoto = async () => {
    const result = await onAction(() => removePhoto().unwrap(), "Profile photo removed.");
    if (result) setPhotoSelection(null);
  };
  return <section className="mt-7 max-w-3xl"><PageHeading eyebrow="Account" title="My profile" description="Update your account details and security settings."/><div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-indigo-50 to-violet-50 p-6"><Avatar name={user.name} photoURL={user.photoURL} userId={user._id} className="size-16 text-lg"/><div className="min-w-0 flex-1"><h3 className="text-xl font-bold">{user.name}</h3><p className="mt-1 text-sm capitalize text-indigo-700">{user.role}</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><label className={`${secondary} cursor-pointer`}><Camera size={16}/>{user.photoURL ? "Change photo" : "Upload photo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choosePhoto} disabled={photoBusy}/></label>{user.photoURL && <button type="button" onClick={clearPhoto} disabled={photoBusy} className={secondary}><X size={16}/>Remove</button>}</div></div>{photoSelection && <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/70 bg-white p-5"><img src={photoSelection.preview} alt="Selected profile photo preview" className="size-16 rounded-full object-cover ring-2 ring-indigo-200"/><div className="flex-1"><p className="text-sm font-semibold">Preview your new photo</p><p className="mt-1 text-xs text-slate-500">Save to use this photo across your account.</p></div><button type="button" onClick={savePhoto} disabled={photoBusy} className={button}>{photoBusy && <LoaderCircle className="animate-spin" size={16}/>}Save photo</button><button type="button" onClick={()=>setPhotoSelection(null)} disabled={photoBusy} className={secondary}>Cancel</button></div>}{photoError && <p role="alert" className="border-t border-rose-200 px-5 py-3 text-sm text-rose-700">{photoError}</p>}<div className="divide-y divide-slate-100 px-6"><ProfileRow label="Email address" value={user.email}/><ProfileRow label="Account type" value={user.role}/><ProfileRow label="Member since" value={new Date(user.createdAt).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}/></div></div><form onSubmit={(event)=>{event.preventDefault();onAction(()=>updateProfile({name}).unwrap(),"Profile updated.");}} className="mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5"><h3 className="font-bold">Profile details</h3><label className="block text-sm font-medium">Full name<input required maxLength="100" value={name} onChange={(event)=>setName(event.target.value)} className={field+" mt-2"}/></label><button className={button}>Save profile</button></form><form onSubmit={(event)=>{event.preventDefault();onAction(()=>changePassword({currentPassword,newPassword}).unwrap(),"Password changed.");setCurrentPassword("");setNewPassword("");}} className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5"><h3 className="font-bold">Change password</h3><label className="block text-sm font-medium">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event)=>setCurrentPassword(event.target.value)} className={field+" mt-2"}/></label><label className="block text-sm font-medium">New password<input required minLength="8" type="password" autoComplete="new-password" value={newPassword} onChange={(event)=>setNewPassword(event.target.value)} className={field+" mt-2"}/></label><button className={secondary}>Change password</button></form></section>;
}

function ProfileRow({ label, value }) { return <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-semibold capitalize text-slate-800">{value}</span></div>; }
function MiniMetric({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>; }
function AssignmentPreview({ assignment, onClick }) { return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><Clock3 size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{assignment.title}</span><span className="block truncate text-xs text-slate-500">{assignment.course?.title || "Course"}</span></span><span className="shrink-0 text-[11px] text-slate-400">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "Open"}</span><ArrowRight size={14} className="shrink-0 text-slate-400"/></button>; }
function QuickLink({ icon: Icon, title, onClick }) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/50"><span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon size={17}/></span><span className="flex-1 text-sm font-semibold">{title}</span><ArrowRight size={15} className="text-slate-400"/></button>; }
function EmptyState({ icon: Icon, title, text, action }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon size={22}/></span><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Loading() { return <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm font-medium text-slate-500">Loading your learning space...</div>; }

export default Dashboard;
