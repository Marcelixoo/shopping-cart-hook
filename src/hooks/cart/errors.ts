export class ProductOutOfStock extends Error {
  constructor() {
    super()
    this.message = 'Quantidade solicitada fora de estoque';
  }
}

export class ProductNotFoundInCart extends Error {
  constructor() {
    super()
    this.message = 'Produto selecionado não está presente no carrinho';
  }
}

export class InvalidAmount extends Error {
  constructor() {
    super()
    this.message = 'Quantidade deve ser maior do que zero';
  }
}