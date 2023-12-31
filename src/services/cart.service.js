const httpStatus = require("http-status");
const { Cart, Product,User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const res = await Cart.findOne({email: user.email});
  if(!res){
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart")
  }
  return res
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let customerData = await Cart.findOne({email: user.email});
  if (!customerData) {
    try {
      let userObj = {
        email: user.email,
        cartItems: [],
        paymentOption: config.default_payment_option,
      };
      customerData = await new Cart(userObj);
      await customerData.save();

    } catch (error) {
      console.log("catchMe");
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "cart creation fails"
      );
    }
  }


  let prodind = -1;
  for(let i = 0; i< customerData.cartItems.length; i++){
    if(customerData.cartItems[i].product._id == productId){
      prodind = i;
    }
  }

  if(prodind !== -1){
    throw new ApiError(400, "product already exist in cart Use the cart to update or remove the item");
  }

  const productData = await Product.findById(productId);
  if(!productData){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database");
  }


  customerData.cartItems.push({
    product:productData,
    quantity: quantity,
  });
  try {
    await customerData.save();
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save cart data");
  }
  return customerData;
};


/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  let customerData = await Cart.findOne({email: user.email});
  if(!customerData){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart. Use POST to create and add a product");
  }
  let prodExist = await Product.findById(productId);
  if(!prodExist){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database");
  }

  let prodind = -1;
  for(let i = 0; i < customerData.cartItems.length; i++){
    if(customerData.cartItems[i].product._id == productId){
      prodind = i;
      break;
    }
  }

  if(prodind == -1){
    throw new ApiError(400, "Product not in cart");
  }

  customerData.cartItems[prodind].quantity = quantity;
  await customerData.save();
  return customerData;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  // console.log(user, productId)
  let customerData = await Cart.findOne({email: user.email});
  if(!customerData){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  let prodind = -1;
  for (let i = 0; i < customerData.cartItems.length; i++) {
    if (customerData.cartItems[i].product._id == productId) {
      cacheData = customerData.cartItems[i];
      prodind = i;
      break;
    }
  }

  if(prodind == -1){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  customerData.cartItems.splice(prodind, 1);
  customerData.save();
  return;
};

const checkout = async (user) => {
  // console.log(user);
  const cart = await Cart.findOne({email:user.email})

  if(cart == null){
    throw new ApiError(httpStatus.NOT_FOUND,"User does not have a cart");
  }
  if(cart.cartItems.length==0)
  {
    throw new ApiError(httpStatus.BAD_REQUEST,"User does not have items in the cart");
  }

  const hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();
  if(!hasSetNonDefaultAddress)
  throw new ApiError(httpStatus.BAD_REQUEST,"Address not set");

  const total = cart.cartItems.reduce((acc,item)=>{
    acc=acc+(item.product.cost *item.quantity);
    return acc;
  },0)

  if(total > user.walletMoney){
    throw new ApiError(httpStatus.BAD_REQUEST,"User does not have sufficient balance")
  }
  user.walletMoney -= total;
  await user.save();

  cart.cartItems= []
  await cart.save();

};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
