import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

const LOCAL_STORAGE_KEY = '@RocketShoes:cart';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

type StockItem = {
  id: number;
  amount: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    async function productIsOutOfStock(productId: number) {
      const { data: product } = await api.get<StockItem>(`stock/${productId}`);

      return product.amount > 0;
    }

    function updateCart(newCart: Product[]) {
      setCart(newCart);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
    }

    try {
      const isOutOfStock = await productIsOutOfStock(productId);

      if (isOutOfStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      };

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: product.amount + 1
          }
        }

        return product;
      });

      updateCart(newCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
