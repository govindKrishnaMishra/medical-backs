import mongoose , {Schema} from "mongoose";

let profile_imgs_name_list = ["Garfield", "Tinkerbell", "Annie", "Loki", "Cleo", "Angel", "Bob", "Mia", "Coco", "Gracie", "Bear", "Bella", "Abby", "Harley", "Cali", "Leo", "Luna", "Jack", "Felix", "Kiki"];
let profile_imgs_collections_list = ["notionists-neutral", "adventurer-neutral", "fun-emoji"];


const userScheme = new Schema( {
     
      personal_info: {
         fullName : {
             type:String,
             lowercase: true,
             required:true,
             minLength:[3, 'Fullname must be at least 3 letters long']
         },
         email : {
             type:String,
             required: true,
             lowercase:true,
             unique:true,
         },
         password : {
             type : String,
         },
         username: {
             type: String,
         },
         bio:{
            type:String,
            maxlength:[200,'bio should be at least 200 letters long']
        },
        profile_img:{
            type:String,
            default:() => {
                return `https://api.dicebear.com/6.x/${profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)]}/svg?seed=${profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]}`
            }
        },
      },
 
   
     google_auth: {
         type:Boolean,
         default:false
     },
     UsersDetails:[{
        type:  Schema.Types.ObjectId ,
        ref:"UsersDetails"
        // default:[],
     }],
     medical_history :[{
         type :  Schema.Types.ObjectId,
         ref : "medical_history"
        //  default: []
     }],
     
    },
     {
        timestamps:{
           createdAt: 'joined_at',
        },
        collection: "Users"
     }
      
)

export default mongoose.model("User",userScheme);