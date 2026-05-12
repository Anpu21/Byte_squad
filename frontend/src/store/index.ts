import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import shopCartReducer, { persistShopCart } from './slices/shopCartSlice';
import adminContextReducer, {
    persistAdminContext,
} from './slices/adminContextSlice';

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        auth: authReducer,
        shopCart: shopCartReducer,
        adminContext: adminContextReducer,
    },
});

// Persist the customer's shop cart so a guest's selections survive reloads.
let lastShopCart = store.getState().shopCart;
let lastAdminContext = store.getState().adminContext;
store.subscribe(() => {
    const state = store.getState();
    if (state.shopCart !== lastShopCart) {
        lastShopCart = state.shopCart;
        persistShopCart(state.shopCart);
    }
    if (state.adminContext !== lastAdminContext) {
        lastAdminContext = state.adminContext;
        persistAdminContext(state.adminContext);
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
