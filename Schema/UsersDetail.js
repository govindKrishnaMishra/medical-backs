import mongoose  from "mongoose";


const userSchema = new mongoose.Schema({
        
     name : {
         type:String , 
         required : true,

     },
     email : {
         type : String ,
         required : true, 
         unique:true,
     },
     address: {
         type : String,
         
     },
     gender : {
         type : String,
         required: true,
         
     },
     age : {
         type:Number,
         required: true,
     },
     

}, 
 {
      timestamps: {
         createdAt: 'jointed_at',
      },
      collection: "UsersDetails",
 })


export default mongoose.model('UsersDetails' , userSchema);

 