// RTK Query endpoints for authenticated LMS API requests.
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create the API configuration
export const apiSlice = createApi({
    reducerPath: "api",

    // Connect to the backend server
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1/",
        credentials: "include",
    }),
    tagTypes: ["Auth", "Courses", "Assignments", "Users", "Announcements", "Messages", "Quizzes"],

    // Define backend API endpoints
    endpoints: (builder) => ({

        // Register a new user
        register: builder.mutation({
            query: (input) => ({
                url: "user/register",
                method: "POST",
                body: input,
            }),
            invalidatesTags: ["Auth"],
        }),

        // Login an existing user
        login: builder.mutation({
            query: (input) => ({
                url: "user/login",
                method: "POST",
                body: input,
            }),
            invalidatesTags: ["Auth"],
        }),

        me: builder.query({ query: () => "user/me", providesTags: ["Auth"] }),
        logout: builder.mutation({ query: () => ({ url: "user/logout", method: "POST" }) }),
        uploadProfilePhoto: builder.mutation({ query: (body) => ({ url: "user/me/photo", method: "POST", body }), invalidatesTags: ["Auth"] }),
        removeProfilePhoto: builder.mutation({ query: () => ({ url: "user/me/photo", method: "DELETE" }), invalidatesTags: ["Auth"] }),
        courses: builder.query({ query: () => "courses", providesTags: ["Courses"] }),
        learners: builder.query({ query: () => "courses/students", providesTags: ["Users"] }),
        courseStudents: builder.query({ query: (id) => `courses/${id}/students`, providesTags: ["Users"] }),
        createCourse: builder.mutation({ query: (body) => ({ url: "courses", method: "POST", body }), invalidatesTags: ["Courses"] }),
        updateCourse: builder.mutation({ query: ({ id, ...body }) => ({ url: `courses/${id}`, method: "PATCH", body }), invalidatesTags: ["Courses"] }),
        deleteCourse: builder.mutation({ query: (id) => ({ url: `courses/${id}`, method: "DELETE" }), invalidatesTags: ["Courses", "Assignments"] }),
        addLesson: builder.mutation({ query: ({ id, ...body }) => ({ url: `courses/${id}/lessons`, method: "POST", body }), invalidatesTags: ["Courses"] }),
        updateLesson: builder.mutation({ query: ({ id, lessonId, ...body }) => ({ url: `courses/${id}/lessons/${lessonId}`, method: "PATCH", body }), invalidatesTags: ["Courses", "Auth"] }),
        deleteLesson: builder.mutation({ query: ({ id, lessonId }) => ({ url: `courses/${id}/lessons/${lessonId}`, method: "DELETE" }), invalidatesTags: ["Courses", "Auth"] }),
        enroll: builder.mutation({ query: (id) => ({ url: `courses/${id}/enroll`, method: "POST" }), invalidatesTags: ["Auth", "Courses"] }),
        completeLesson: builder.mutation({ query: ({ id, lessonId }) => ({ url: `courses/${id}/lessons/${lessonId}/complete`, method: "POST" }), invalidatesTags: ["Auth"] }),
        assignments: builder.query({ query: () => "assignments", providesTags: ["Assignments"] }),
        createAssignment: builder.mutation({ query: ({ courseId, ...body }) => ({ url: `assignments/course/${courseId}`, method: "POST", body }), invalidatesTags: ["Assignments"] }),
        updateAssignment: builder.mutation({ query: ({ id, ...body }) => ({ url: `assignments/${id}`, method: "PATCH", body }), invalidatesTags: ["Assignments"] }),
        deleteAssignment: builder.mutation({ query: (id) => ({ url: `assignments/${id}`, method: "DELETE" }), invalidatesTags: ["Assignments", "Courses"] }),
        submitAssignment: builder.mutation({ query: ({ id, body }) => ({ url: `assignments/${id}/submit`, method: "POST", body }), invalidatesTags: ["Assignments"] }),
        gradeSubmission: builder.mutation({ query: ({ id, submissionId, ...body }) => ({ url: `assignments/${id}/submissions/${submissionId}`, method: "PATCH", body }), invalidatesTags: ["Assignments"] }),
        users: builder.query({ query: () => "user", providesTags: ["Users"] }),
        changeRole: builder.mutation({ query: ({ id, role }) => ({ url: `user/${id}/role`, method: "PATCH", body: { role } }), invalidatesTags: ["Users"] }),
        setUserActive: builder.mutation({ query: ({ id, isActive }) => ({ url: `user/${id}/status`, method: "PATCH", body: { isActive } }), invalidatesTags: ["Users"] }),
        updateProfile: builder.mutation({ query: (body) => ({ url: "user/me/profile", method: "PATCH", body }), invalidatesTags: ["Auth"] }),
        changePassword: builder.mutation({ query: (body) => ({ url: "user/me/password", method: "PATCH", body }), invalidatesTags: ["Auth"] }),
        forgotPassword: builder.mutation({ query: (body) => ({ url: "user/forgot-password", method: "POST", body }) }),
        resetPassword: builder.mutation({ query: (body) => ({ url: "user/reset-password", method: "POST", body }) }),
        verifyEmail: builder.mutation({ query: (body) => ({ url: "user/verify-email", method: "POST", body }) }),
        resendVerification: builder.mutation({ query: (body) => ({ url: "user/resend-verification", method: "POST", body }) }),
        course: builder.query({ query: (id) => `courses/${id}`, providesTags: ["Courses", "Quizzes", "Announcements"] }),
        uploadResource: builder.mutation({ query: ({ id, body }) => ({ url: `courses/${id}/resources`, method: "POST", body }), invalidatesTags: ["Courses"] }),
        deleteResource: builder.mutation({ query: ({ id, resourceId }) => ({ url: `courses/${id}/resources/${resourceId}`, method: "DELETE" }), invalidatesTags: ["Courses"] }),
        createQuiz: builder.mutation({ query: ({ courseId, ...body }) => ({ url: `courses/${courseId}/quizzes`, method: "POST", body }), invalidatesTags: ["Courses", "Quizzes"] }),
        updateQuiz: builder.mutation({ query: ({ id, ...body }) => ({ url: `assignments/quizzes/${id}`, method: "PATCH", body }), invalidatesTags: ["Courses", "Quizzes"] }),
        submitQuizAttempt: builder.mutation({ query: ({ id, ...body }) => ({ url: `quizzes/${id}/attempt`, method: "POST", body }), invalidatesTags: ["Quizzes"] }),
        quizAttempts: builder.query({ query: (id) => `assignments/quizzes/${id}/attempts`, providesTags: ["Quizzes"] }),
        announcements: builder.query({ query: () => "communication/announcements", providesTags: ["Announcements"] }),
        createAnnouncement: builder.mutation({ query: ({ courseId, ...body }) => ({ url: `courses/${courseId}/announcements`, method: "POST", body }), invalidatesTags: ["Announcements", "Courses"] }),
        updateAnnouncement: builder.mutation({ query: ({ id, ...body }) => ({ url: `communication/announcements/${id}`, method: "PATCH", body }), invalidatesTags: ["Announcements", "Courses"] }),
        deleteAnnouncement: builder.mutation({ query: (id) => ({ url: `communication/announcements/${id}`, method: "DELETE" }), invalidatesTags: ["Announcements", "Courses"] }),
        courseMessages: builder.query({ query: (courseId) => `communication/courses/${courseId}/messages`, providesTags: ["Messages"] }),
        sendCourseMessage: builder.mutation({ query: ({ courseId, body }) => ({ url: `communication/courses/${courseId}/messages`, method: "POST", body }), invalidatesTags: ["Messages"] }),

    }),
});

// Export hooks for API requests
export const {
    useRegisterMutation,
    useLoginMutation,
    useMeQuery,
    useLogoutMutation,
    useUploadProfilePhotoMutation,
    useRemoveProfilePhotoMutation,
    useCoursesQuery,
    useCourseStudentsQuery,
    useLearnersQuery,
    useCreateCourseMutation,
    useUpdateCourseMutation,
    useDeleteCourseMutation,
    useAddLessonMutation,
    useUpdateLessonMutation,
    useDeleteLessonMutation,
    useEnrollMutation,
    useCompleteLessonMutation,
    useAssignmentsQuery,
    useCreateAssignmentMutation,
    useUpdateAssignmentMutation,
    useDeleteAssignmentMutation,
    useSubmitAssignmentMutation,
    useGradeSubmissionMutation,
    useUsersQuery,
    useChangeRoleMutation,
    useSetUserActiveMutation,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useVerifyEmailMutation,
    useResendVerificationMutation,
    useCourseQuery,
    useUploadResourceMutation,
    useDeleteResourceMutation,
    useCreateQuizMutation,
    useUpdateQuizMutation,
    useSubmitQuizAttemptMutation,
    useQuizAttemptsQuery,
    useAnnouncementsQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
    useCourseMessagesQuery,
    useSendCourseMessageMutation,
} = apiSlice;
