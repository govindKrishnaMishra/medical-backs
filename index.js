import  express from "express";
import 'dotenv/config'
import cors from 'cors';
import mongoose from "mongoose";
import User from './Schema/User.js'
import bcrypt, { hash } from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken'
import admin from 'firebase-admin';
import {getAuth } from 'firebase-admin/auth'
import medical from "./Schema/medical.js";
import serviceAccountKey from './medical-d2edf-firebase-adminsdk-9r0jz-5d04cf6a1d.json' assert{type:"json"}
import UsersDetails from "./Schema/UsersDetail.js";
import { ObjectId } from "bson";
// import  jwt  from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

admin.initializeApp({
    credential : admin.credential.cert(serviceAccountKey)
})


mongoose.connect(process.env.DB_LOCATION, {
     autoIndex : true
})



let generateRandomUserName = async(email) => {
         
    let username = email.split("@")[0];

    const usernameExists = await User.exists({"personal_info.username":username}).then((result)=>result);

    usernameExists ?  username += nanoid().substring(0,5) : '';

    return username;


}

const verifyJWT = (req,res , next) => {
     
     
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1];
    console.log(token);

    if(token == null) {
        return res.status(401).json({error : "No Access token "})
    }

    jwt.verify(token , process.env.SECRET_ACCESS_KEY ,(err, user) => {
             if(err) {
                     return res.status(403).json({error : "Access Token is envalid"})
             }

             req.user = user.id
             next()
    })
}


app.get("/get-details-admin", async (req, res) => {
    try {
      const users = await User.find({})
        .populate({
          path: 'UsersDetails',
          model: "UsersDetails"
        })
        .populate({
          path: 'medical_history',
          model: 'medical_history',
           
        })
       
  
      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'Users not found' });
      }
  
      console.log(users);
      return res.status(200).json({ users });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ error: 'An error occurred while fetching user details' });
    }
  });


app.get("/get-details", verifyJWT, async (req, res) => {
    try {
      const userId = req.user; // Get the user ID from the request object



    //   const { email , password } = req.query;
    //   console.log(email);
    //   console.log(password);

      

            // if(email == "gkm12345@gmail.com" && password == "Mishra@12345") {
            //     const users = await User.find({})
            //     .populate({ path: 'UserDetails', model: 'UsersDetails' })
            //     .populate({ path: 'medical_history', model: 'medical_history' });
        
            // console.log(users);
            // res.status(200).json({ users });

            // }  
            // // Find the user by their ID and populate the userDetails and medical_history fields
            // else {
                const user = await User.findById(userId)
                .populate({ path: 'UsersDetails', model: 'UsersDetails' })
                .populate({ path: 'medical_history', model: 'medical_history' });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
            
                console.log(user);
                console.log({user});
                res.status(200).json({ user });
            // }
      
    

    } catch (error) {

      console.error('Error fetching user details:', error);
      res.status(500).json({ error: 'An error occurred while fetching user details' });

    }

  });


app.post('/details1', async (req, res) => {
    try {
        const { names, ages, addresss, emails, genders , userEmail } = req.body;

        const userDetails = new UsersDetails({
            name: names,
            age: ages,
            address: addresss,
            email: emails,
            gender: genders
        });

       let save_details =  await userDetails.save();

       let Obj_id =  save_details._id;
        await User.updateOne(

            {
                "personal_info.email":userEmail
            },
            {
                 $push : {
                     UsersDetails : Obj_id
                 },
            },
            {upsert : false , new: true},
           
            
            console.log("dateabase update successfully")
        );

         return res.status(201).json({ message: 'Data saved successfully' });

    } catch (error) {
        console.error('Error saving user details:', error);
        if (error.code === 11000) {
            return res.status(500).json({ error: 'Email already exists' });
        } else {
            return res.status(500).json({ error: 'An error occurred while saving data' });
        }
    }
});


app.post('/details2', async (req, res) => {
    try {
        const { Diseases, Allergies, score, Previous_Surgeries, Current_medical_Conditions , userEmail } = req.body;

        const medicalRecord = new medical({
            Disease: Diseases,
            Allergie: Allergies,
            Surgery_History: Previous_Surgeries,
            Medical_Condition: Current_medical_Conditions,
            scores: score
        });

        let save_details = await medicalRecord.save();

        let Obj_id =  save_details._id;

        await User.updateOne(

            {
                "personal_info.email": userEmail
            },
            {
                 $push : {
                    medical_history : Obj_id
                 },
            },
            {upsert : false , new: true},
            console.log("dateabase update successfully")
        )
         
        return res.status(201).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving medical record:', error);
        if (error.code === 11000) {
            return res.status(500).json({ error: 'Medical record already exists' });
        } else {
            return res.status(500).json({ error: 'An error occurred while saving medical record' });
        }
    }
});


 

const formatDataToSend = (user, status) => {

    let access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);

   

        // Now access UsersDetails
        // console.log(user.UsersDetails);

    if (status === "signup") {
        return {
            access_token,
            profile_img: user.personal_info.profile_img,
            username: user.personal_info.username,
            fullName: user.personal_info.fullName,
        };
    } else if (status === "login") {
        
        return {
            access_token,
            loginStatus: "true",
            profile_img: user.personal_info.profile_img,
            username: user.personal_info.username,
            fullName: user.personal_info.fullName,

        };
    }
};

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;



app.post("/signup" , async(req,res) =>  {
         

    let {fullName , email , password} = req.body;

    if(fullName.length < 3) {
            return res.status(403).json({"error" : "FullName must be grater then 3 characers"});
    }
    if(!email.length){
            return res.status(403).json({"error": "Please enter your email"});
    }
    if(!emailRegex.test(email)){
           return res.status(403).json({"error":"Email is not valid"});
    }

    let existingemail = await User.findOne({"personal_info.email" : email});

    if(existingemail) {
         return res.status(409).json({"error" : "Email already exists Please login"});
    }

    if(!password.length) {
            return res.status(403).json({"error" : "Please enter your password"});
    }
    if(!passwordRegex.test(password)){
            return res.status(403).json({"error":"Password must be at least 6 characters long and contain at least one number,one numeric ,  one lowercase and one uppercase letter"});
    }



    bcrypt.hash(password,10,async(err,hash) => {

           let username = await generateRandomUserName(email);

           let user = new User ({
                    
              personal_info : {username , email , password:hash , fullName }
           })
           console.log(user);

           user.save().then((data) => {
                    return res.status(200).json(formatDataToSend(data ,  "signup"))
           }).catch((err)=> {
                    
                   if(err.code === 11000) {
                           return res.status(500).json({"error":"Email already exists"})
                   }
                 else {
                     return res.status(500).json({"error":"Internal server error"})
                 }
           })
           
    })

})

// server.get("/admin-login",async(req,res)=> {

//     const user = await User.find({})
//     .populate({ path: 'UsersDetails', model: 'UsersDetails' })
//     .populate({ path: 'medical_history', model: 'medical_history' });

//      console.log(user);
//      return res.status(200).json({user})

// })

app.post("/signin" , async(req,res) => {
    
   let { email , password } = req.body; 
 
     await User.findOne({"personal_info.email" : email}).then((user)=> {
            if(!user){
                    return res.status(401).json({"error":"User is not exists"})
            }

            
            if(!user.google_auth) {
                    
                      bcrypt.compare(password , user.personal_info.password , async(err,data) => {

                            if(err){
                                   res.status(403).json({"error" : "Error occured while login please try again"})
                            }

                            if(!data){
                                    res.status(403).json({"error":"Incorrect password"})
                            }

                            if(data) {
                                   
                                try {

                                //  await user.find({}).populate('UsersDetails' , "age gender -_id" );
                                //     console.log(user);
                            
                                    // const formattedUserData = formatDataToSend(user, "login");

                                    return res.status(200).json(formatDataToSend(user, "login"));

                                } catch (err) {
                                    console.error("Error during population:", err); 
                                    return res.status(500).json({ error: "Error populating data" });
                                }
                
                            }
                      })
            } else {
                    return res.status(403).json({"error" : "Same account was created using google . Try logging In with google"})
            }
    })

 
})

app.post("/google-auth" , async(req,res) => {
    
   let { access_token  } = req.body;
   console.log(access_token);
   
   await getAuth().verifyIdToken(access_token)
   .then(async(decodedUser) => {

           console.log("HELLO");
            
       let {email , name , picture} = decodedUser;

       console.log(email);
       console.log(name);
       console.log(picture);

       picture = picture.replace("s96-c" , "s384-c");

       let user  = await User.findOne({"personal_info.email" : email}).select("personal_info.fullName personal_info.username personal_info.profile_img google_auth").then((u)=> {
            return u || null
       })
       .catch(err => {
            return res.status(500).json({"error" : err.message})
       })

       let logins = "false";

       if(user) {  //login
            if(!user.google_auth){
                return res.status(403).json({"error" : "this email signup with out google auth . Please login with password to access the account"})    
            }
            logins = "true";

       }
       else {

            let username = await generateRandomUserName(email)

            user =  new User({
               
                   personal_info : {fullName:name , email ,  username },
                    google_auth: true
            })
             
            await user.save().then((u) => {
                    user = u ;
            })
            .catch(err => {
                    return res.status(500).json({"error" : err.message})
            })
       }

    //    await user.populate("UsersDetails medical_history").execPopulate();
    return res.status(200).json(formatDataToSend(user, (logins == "true") ? "login" : "signup"))
        

   })
   .catch((error) => {
            
            return res.status(500).json({"error" : error.message ||  "Failed to authenticate"})
   })

})

app.listen(PORT , ()=> {
     console.log(`server running at port ${PORT}`);
 })