import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { errorHandler } from "../utils/error.js";
import jwt from 'jsonwebtoken'

// export const signup = async (req,res,next)=>{
//     const {username , email ,password} = req.body;

//     if(!username || !email || !password || username === " " || email === " " || password === " "){
//        next(errorHandler(400, "All field are required"));
//     }

    
//     try{
//         await newUser.save();
        
//         res.json('Sign up successfully')
//     }catch(error){
//         next(error);
//     }
//     const hashedPassword = bcrypt.hashSync(password ,10)

//     const newUser = new User({
//         username ,
//          email ,
//          password: hashedPassword,
//     }
//     );


// };

export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;

    // Check for missing or empty required fields
    if (!username || !email || !password || username.trim() === '' || email.trim() === '' || password.trim() === '') {
        return next(errorHandler(400, "All fields are required"));
    }

    try {
        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create a new user instance
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Save the new user to the database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'Sign up successful' });
    } catch (error) {
        // Pass the error to the error handling middleware
        next(error);
    }
};


// export const signin = async (req,res,next)=>{
//     const {email , password } = req.body;

//     if(!email || !password || email === " " || password === " "){
//         next(errorHandler(400,'All fields are required'))
//     }


//     try{
//             const validUser = await User.findOne({email});
//             if(!validUser){
//                  return next(errorHandler(400,'User not found'))
                
//             }

//             const validPassword = bcrypt.compareSync(password,validUser.password);
//             if(!validPassword){
//                return next(errorHandler(400,'Invalid Password'))

//             }

//             const token = jwt.sign(
//                     {
//                         // id
//                         id:validUser._id , isAdmin:validUser.isAdmin
//                     },
//                     // secret 
//                     process.env.JWT_SECRET,
//                     // here can i add time for session 
//             );

//             const {password : pass , ...rest} = validUser._doc;
//             res.status(200).cookie('access_token',token,{
//                 httpOnly:true
//             }).json(rest)
//     }catch(error){
//         next(error);
//     }
// }

export const signin = async (req, res, next) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password || email.trim() === '' || password.trim() === '') {
        return next(errorHandler(400, 'All fields are required'));
    }

    try {
        const validUser = await User.findOne({ email });
        if (!validUser) {
            return next(errorHandler(400, 'User not found'));
        }

        const validPassword = bcrypt.compareSync(password, validUser.password);
        if (!validPassword) {
            return next(errorHandler(400, 'Invalid Password'));
        }

        // Generate JWT token with expiration time (e.g., expires in 1 day)
        const token = jwt.sign(
            {
                id: validUser._id,
                isAdmin: validUser.isAdmin
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Exclude sensitive fields and set JWT token as an HTTP-only cookie
        const { password: pass, ...rest } = validUser._doc;
        res.status(200).cookie('access_token', token, {
            httpOnly: true
            // Additional cookie options can be added here
        }).json(rest);
    } catch (error) {
        next(error);
    }
};






export const google = async (req, res, next) => {
    const { email, name, googlePhotoUrl } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            // User found, generate token
            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);

            const { password, ...rest } = user._doc;
            res.status(200).cookie('access_token', token, { httpOnly: true }).json(rest);
        } else {
            // User not found, create new user
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcrypt.hashSync(generatedPassword, 10);

            const newUser = new User({
                username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
            });

            await newUser.save();

            // Generate token for new user
            const token = jwt.sign({ id: newUser._id, isAdmin: newUser.isAdmin }, process.env.JWT_SECRET);

            const { password: newPassword, ...newUserRest } = newUser._doc;
            res.status(200).cookie('access_token', token, { httpOnly: true }).json(newUserRest);
        }
    } catch (error) {
        next(error);
    }
};



