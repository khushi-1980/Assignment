import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './interactionSlice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    interactions: interactionReducer,
    chat: chatReducer,
  },
});

export default store;
