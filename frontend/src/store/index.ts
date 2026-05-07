import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import shopCartReducer, { persistShopCart } from './slices/shopCartSlice';
import customerAuthReducer from './slices/customerAuthSlice';

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        auth: authReducer,
        shopCart: shopCartReducer,
        customerAuth: customerAuthReducer,
    },
});

// Persist the customer's shop cart so a guest's selections survive reloads.
let lastShopCart = store.getState().shopCart;
store.subscribe(() => {
    const next = store.getState().shopCart;
    if (next !== lastShopCart) {
        lastShopCart = next;
        persistShopCart(next);
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
