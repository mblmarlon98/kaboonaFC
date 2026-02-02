import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    // Slices will be added here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
