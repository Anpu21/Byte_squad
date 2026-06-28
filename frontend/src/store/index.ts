import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
    FLUSH,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    REHYDRATE,
    persistReducer,
    persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import shopCartReducer from './slices/shopCartSlice';
import shopBranchReducer from './slices/shopBranchSlice';
import adminContextReducer from './slices/adminContextSlice';
import shopContextReducer from './slices/shopContextSlice';
import { migrateLegacyPersistedState } from './migrations';

migrateLegacyPersistedState();

const rootReducer = combineReducers({
    cart: cartReducer,
    auth: authReducer,
    shopCart: shopCartReducer,
    shopBranch: shopBranchReducer,
    shopContext: shopContextReducer,
    adminContext: adminContextReducer,
});

const persistedReducer = persistReducer(
    {
        key: 'ledgerpro_root',
        version: 1,
        storage,
        // POS `cart` is intentionally session-scoped — the register clears
        // on reload. Only persist auth / shopCart / adminContext.
        whitelist: [
            'auth',
            'shopCart',
            'shopBranch',
            'shopContext',
            'adminContext',
        ],
    },
    rootReducer,
);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
