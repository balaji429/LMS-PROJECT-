// Redux store configuration and API middleware registration.
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../features/api/apiSlice";

// Create the Redux store
export const appStore = configureStore({

    // Register all reducers here
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
    },

    // Add RTK Query middleware to the store
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});