import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/apiClient';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchHCPs = createAsyncThunk('interactions/fetchHCPs', async (query = '') => {
  const res = await api.get(`/api/hcps?q=${query}`);
  return res.data;
});

export const logInteraction = createAsyncThunk(
  'interactions/logInteraction',
  async (interactionData, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/interactions', interactionData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to log interaction');
    }
  }
);

export const editInteraction = createAsyncThunk(
  'interactions/editInteraction',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/interactions/${id}`, updates);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update interaction');
    }
  }
);

export const fetchHCPHistory = createAsyncThunk(
  'interactions/fetchHCPHistory',
  async (hcpId) => {
    const res = await api.get(`/api/interactions/hcp/${hcpId}`);
    return res.data;
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const interactionSlice = createSlice({
  name: 'interactions',
  initialState: {
    hcps: [],
    hcpHistory: [],
    currentInteraction: null,
    submittedInteraction: null,
    loading: false,
    hcpLoading: false,
    error: null,
    success: false,
    activeView: 'form', // 'form' | 'chat'
    formData: {
      hcp_id: '',
      hcp_name: '',
      interaction_type: 'Meeting',
      interaction_date: new Date().toISOString().split('T')[0],
      interaction_time: new Date().toTimeString().slice(0, 5),
      attendees: '',
      topics_discussed: '',
      materials_shared: [],
      samples_distributed: [],
      sentiment: 'neutral',
      outcomes: '',
      follow_up_actions: '',
    },
  },
  reducers: {
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetForm: (state) => {
      state.formData = {
        hcp_id: '',
        hcp_name: '',
        interaction_type: 'Meeting',
        interaction_date: new Date().toISOString().split('T')[0],
        interaction_time: new Date().toTimeString().slice(0, 5),
        attendees: '',
        topics_discussed: '',
        materials_shared: [],
        samples_distributed: [],
        sentiment: 'neutral',
        outcomes: '',
        follow_up_actions: '',
      };
      state.success = false;
      state.error = null;
      state.submittedInteraction = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.submittedInteraction = null;
    },
    addMaterial: (state, action) => {
      state.formData.materials_shared.push(action.payload);
    },
    removeMaterial: (state, action) => {
      state.formData.materials_shared = state.formData.materials_shared.filter(
        (_, i) => i !== action.payload
      );
    },
    addSample: (state, action) => {
      state.formData.samples_distributed.push(action.payload);
    },
    removeSample: (state, action) => {
      state.formData.samples_distributed = state.formData.samples_distributed.filter(
        (_, i) => i !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchHCPs
      .addCase(fetchHCPs.pending, (state) => { state.hcpLoading = true; })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.hcpLoading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state) => { state.hcpLoading = false; })

      // logInteraction
      .addCase(logInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(logInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.submittedInteraction = action.payload;
        state.hcpHistory.unshift(action.payload);
      })
      .addCase(logInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // editInteraction
      .addCase(editInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.submittedInteraction = action.payload;
        const idx = state.hcpHistory.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.hcpHistory[idx] = action.payload;
      })
      .addCase(editInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchHCPHistory
      .addCase(fetchHCPHistory.fulfilled, (state, action) => {
        state.hcpHistory = action.payload;
      });
  },
});

export const {
  setActiveView, updateFormData, resetForm, clearError, clearSuccess,
  addMaterial, removeMaterial, addSample, removeSample,
} = interactionSlice.actions;

export default interactionSlice.reducer;
