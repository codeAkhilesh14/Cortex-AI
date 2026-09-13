import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
        }
    }
})

export const { setUserData } = userSlice.actions;
export default userSlice.reducer;

// reducers helps us to set the data in userData
// in action.payload we have the user data 
// we export reducers(setUserData) also so we can set userData from any component/files 