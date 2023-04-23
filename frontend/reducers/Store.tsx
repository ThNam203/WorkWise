import {configureStore} from '@reduxjs/toolkit';
import tokenReducer from './Token_reducer';
import UidReducer from './Uid_reducer';
import LoadingReducer from './Loading_reducer';

export const Store = configureStore({
  reducer: {
    token: tokenReducer,
    uid: UidReducer,
    loading: LoadingReducer,
  },
});

export type RootState = ReturnType<typeof Store.getState>;
