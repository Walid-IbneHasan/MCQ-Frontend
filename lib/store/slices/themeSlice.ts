import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
}

const initialState: ThemeState = {
  theme: 'system',
  primaryColor: 'blue',
  accentColor: 'purple',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
    resetTheme: (state) => {
      state.theme = 'system';
      state.primaryColor = 'blue';
      state.accentColor = 'purple';
    },
  },
});

export const { setTheme, setPrimaryColor, setAccentColor, resetTheme } = themeSlice.actions;
export default themeSlice.reducer;