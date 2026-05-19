import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/apiClient';

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, history, hcp_id }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/chat/message', {
        message,
        conversation_history: history,
        hcp_id,
      });
      return { userMessage: message, agentReply: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Agent unavailable');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      {
        role: 'assistant',
        content:
          'Hi! I\'m your AI assistant. You can describe an HCP interaction in natural language and I\'ll log it for you.\n\nTry: *"Met Dr. Sharma today, discussed Product X efficacy and positive trial results. She seemed very interested."*',
        timestamp: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    lastActionTaken: null,
  },
  reducers: {
    clearChat: (state) => {
      state.messages = [
        {
          role: 'assistant',
          content: 'Chat cleared. How can I help you log an HCP interaction?',
          timestamp: new Date().toISOString(),
        },
      ];
      state.error = null;
      state.lastActionTaken = null;
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Immediately add user message
        state.messages.push({
          role: 'user',
          content: action.meta.arg.message,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { agentReply } = action.payload;
        state.messages.push({
          role: 'assistant',
          content: agentReply.reply,
          timestamp: new Date().toISOString(),
          action_taken: agentReply.action_taken,
          suggested_followups: agentReply.suggested_followups,
          interaction_logged: agentReply.interaction_logged,
        });
        state.lastActionTaken = agentReply.action_taken;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({
          role: 'assistant',
          content: `Sorry, I encountered an error: ${action.payload}`,
          timestamp: new Date().toISOString(),
          isError: true,
        });
      });
  },
});

export const { clearChat, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
