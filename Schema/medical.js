import mongoose from "mongoose";
 


const medicalSchema = new mongoose.Schema({

    
    Disease : {
         type:String,
         requierd:true   
    },

    Allergie : {
         type:String,
         required:true,
    },
    Surgery_History : {
         type:String,
         required:true,
    },
    Medical_Condition : {
         type:String,
         requierd:true
    },
    scores : {
      type: Number,
      required: true
    }
 
} ,
 {
    timestamps : {
         createdAt : 'jointed_at'
    } ,
    collection: 'medical_history'
 })

 export default mongoose.model('medical_history' , medicalSchema)