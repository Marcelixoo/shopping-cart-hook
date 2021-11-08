import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ProductNotFoundInCart, ProductOutOfStock } from './cart/errors';
import {
  assertAmountIsGreaterThanZero,
  Cart,
  getCartWithNewProductAmount,
  getNewCartWithProductUpdated,
  productIsNotInCart,
  productWillRunOutOfStock
} from './cart/cart';

const LOCAL_STORAGE_KEY = '@RocketShoes:cart';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Cart;
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Cart>(() => {
    const storagedCart = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const setCartAs = (newCart: Cart) => {
    setCart(newCart);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
  }

  const addProduct = async (productId: number) => {
    try {
      const willRunOutOfStock = await productWillRunOutOfStock(cart, productId, 1, true);

      if (willRunOutOfStock) {
        throw new ProductOutOfStock();
      };

      const newCart = await getNewCartWithProductUpdated(cart, productId);

      setCartAs(newCart);
    } catch(error) {
      if (error instanceof ProductOutOfStock) {
        toast.error(error.message);
        return;
      }
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      if (productIsNotInCart(cart, productId)) {
        throw new ProductNotFoundInCart();
      }

      setCartAs(cart.filter(product => product.id !== productId));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      assertAmountIsGreaterThanZero(amount);

      const willRunOutOfStock = await productWillRunOutOfStock(cart, productId, amount);

      if (willRunOutOfStock) {
        throw new ProductOutOfStock();
      }

      if (productIsNotInCart(cart, productId)) {
        throw new ProductNotFoundInCart();
      }

      const newCart = getCartWithNewProductAmount(cart, productId, amount);

      setCartAs(newCart);
    } catch (error) {
      if (error instanceof ProductOutOfStock) {
        toast.error(error.message);
        return;
      }

      if (error instanceof ProductNotFoundInCart) {
        toast.error(error.message);
        return;
      }

      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);