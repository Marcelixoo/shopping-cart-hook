import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { ProductNotFoundInCart, ProductOutOfStock } from './errors';

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

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const setCartAs = (newCart: Product[]) => {
    setCart(newCart);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
  }

  const productIsNotInCart = (productId: number) => !productIsAlreadyInCart(productId);

  async function productWillRunOutOfStock(productId: number, desiredAmount: number = 1) {
    const { data: fromStock } = await api.get<Stock>(`stock/${productId}`);

    if (productIsAlreadyInCart(productId)) {
      const fromCart = cart.find(product => productId === product.id) as Product;

      const shouldDecreaseAmount = fromCart.amount > desiredAmount;

      if (shouldDecreaseAmount) {
        return fromStock.amount - desiredAmount < 0;
      }

      return fromStock.amount < desiredAmount + fromCart.amount;
    }

    return fromStock.amount < desiredAmount;
  }

  function productIsAlreadyInCart(productId: number): boolean {
    const productIsAlreadyInCart = cart.find(product => productId === product.id);

    return productIsAlreadyInCart !== undefined;
  }

  function getCartWithProductAmountIncremented(productId: number, amount: number = 1): Product[] {
    const newCart = cart.map((product) => {
      if (product.id === productId) {
        return {
          ...product,
          amount: product.amount + amount
        }
      }

      return product;
    });

    return newCart;
  }

  function getCartWithNewProductAmount(productId: number, amount: number = 1): Product[] {
    const newCart = cart.map((product) => {
      if (product.id === productId) {
        return {
          ...product,
          amount: amount
        }
      }

      return product;
    });

    return newCart;
  }

  async function getCartWithNewProduct(productId: number): Promise<Product[]> {
    const { data: newProduct } = await api.get<Product>(`products/${productId}`);

    return [
      ...cart,
      {
        ...newProduct,
        amount: 1
      }
    ];
  }

  async function getCartWithNewProductOrProductAmountIncremented(productId: number): Promise<Product[]> {
    if (productIsAlreadyInCart(productId)) {
      return getCartWithProductAmountIncremented(productId);
    }

    return await getCartWithNewProduct(productId);
  }

  const addProduct = async (productId: number) => {
    try {
      const willRunOutOfStock = await productWillRunOutOfStock(productId);

      if (willRunOutOfStock) {
        throw new ProductOutOfStock();
      };

      const newCart = await getCartWithNewProductOrProductAmountIncremented(productId);

      setCartAs(newCart);
    } catch(error) {
      if (error instanceof ProductOutOfStock) {
        toast.error(error.message);
        return;
      }
      toast.error('Erro na adição do produto');
    }
  };

  function assertAmountIsGreaterThanZero(amount: number) {
    if (amount <= 0) {
      throw new Error("Quantidade deve ser maior do que zero!");
    }
  }

  const removeProduct = async (productId: number) => {
    try {
      if (productIsNotInCart(productId)) {
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

      const willRunOutOfStock = await productWillRunOutOfStock(productId, amount);

      if (willRunOutOfStock) {
        throw new ProductOutOfStock();
      }

      if (productIsNotInCart(productId)) {
        throw new ProductNotFoundInCart();
      }

      const newCart = getCartWithNewProductAmount(productId, amount);

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

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}