const { User } = require("../models");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Implement getUserById(id)
/**
 * Get User by id
 * - Fetch user object from Mongo using the "_id" field and return user object
 * @param {String} id
 * @returns {Promise<User>}
 */


 async function getUserById(id){
    // console.log(id);
    // const user = User.findOne({"_id":id});
    // if(!user){
    //     throw new ApiError(httpStatus.NOT_FOUND, "user not found");
    // }
    // return user;

    return await User.findOne({_id: id});
}


// const setAddress = async(user, newAddress)=>{
//   user.address = new address;
//   await user.save();
//   return user.address;
// }

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Implement getUserByEmail(email)
/**
 * Get user by email
 * - Fetch user object from Mongo using the "email" field and return user object
 * @param {string} email
 * @returns {Promise<User>}
 */


async function getUserByEmail(email){
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(401, "user Email not found");
    }
    return user;
}


const getUserAddressById = async(id)=>{
    const data = await User.findOne({_id: id}, {address: 1, email: 1});
    return data;
}

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Implement createUser(user)
/**
 * Create a user
 *  - check if the user with the email already exists using `User.isEmailTaken()` method
 *  - If so throw an error using the `ApiError` class. Pass two arguments to the constructor,
 *    1. “200 OK status code using `http-status` library
 *    2. An error message, “Email already taken”
 *  - Otherwise, create and return a new User object
 *
 * @param {Object} userBody
 * @returns {Promise<User>}
 * @throws {ApiError}
 *
 * userBody example:
 * {
 *  "name": "crio-users",
 *  "email": "crio-user@gmail.com",
 *  "password": "usersPasswordHashed"
 * }
 *
 * 200 status code on duplicate email - https://stackoverflow.com/a/53144807
 */




const createUser = async (userBody) => {


    if (await User.isEmailTaken(userBody.email)) {
      throw new ApiError(httpStatus.OK, "Email already taken");
    }
    console.log(userBody.password)
  
    const hashedPassword = await bcrypt.hash(userBody.password, 10);
    const user = await User.create({ ...userBody, password: hashedPassword});  
    return user;

  };

  const setAddress = async (user, newAddress) => {
    user.address = newAddress;
    await user.save();
  
    return user.address;
  };



module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    getUserAddressById,
    setAddress
}

