import { api } from '../../services/api';
import { Product, Stock } from '../../types';
import { InvalidAmount } from './errors';

export type Cart = Product[];

export const assertAmountIsGreaterThanZero = (amount: number) => {
  if (amount <= 0) {
    throw new InvalidAmount();
  }
}

export const productWillRunOutOfStock = async (cart: Cart, productId: number, desiredAmount: number = 1) => {
  const { data: fromStock } = await api.get<Stock>(`stock/${productId}`);

  if (productIsAlreadyInCart(cart, productId)) {
    const fromCart = cart.find(product => productId === product.id) as Product;

    const shouldDecreaseAmount = fromCart.amount > desiredAmount;

    if (shouldDecreaseAmount) {
      return fromStock.amount - desiredAmount < 0;
    }

    return fromStock.amount < desiredAmount + fromCart.amount;
  }

  return fromStock.amount < desiredAmount;
}

export const productIsNotInCart = (cart: Cart, productId: number) => !productIsAlreadyInCart(cart, productId);

export const productIsAlreadyInCart = (cart: Cart, productId: number): boolean => {
  const productIsAlreadyInCart = cart.find(product => productId === product.id);

  return productIsAlreadyInCart !== undefined;
}

export const getCartWithNewProductAmount = (cart: Cart, productId: number, amount: number = 1): Cart => {
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

export const getCartWithNewProductOrProductAmountIncremented = async (cart: Cart, productId: number): Promise<Cart> => {
  if (productIsAlreadyInCart(cart, productId)) {
    return getCartWithProductAmountIncremented(cart, productId);
  }

  return await getCartWithNewProduct(cart, productId);
}

const getCartWithNewProduct = async (cart: Cart, productId: number): Promise<Cart> => {
  const { data: newProduct } = await api.get<Product>(`products/${productId}`);

  return [
    ...cart,
    {
      ...newProduct,
      amount: 1
    }
  ];
}

const getCartWithProductAmountIncremented = (cart: Cart, productId: number, amount: number = 1): Cart => {
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