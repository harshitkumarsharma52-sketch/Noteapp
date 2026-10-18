const express= require('express');
const Note=require("./models/note.model");
const cors=require("cors");

const app= express();
app.use(cors());
app.use(express.json())


app.post("/notes",async (req,res)=>{
    const note=req.body;
    await Note.create(note);
    res.status(201).json({
        message:"note created successfully",
        note
    })
})
app.get("/notes",async(req,res)=>{
    const notes=await Note.find();
    res.status(200).json({
        message:"notes fetched successfully",
        notes
    })
})
app.delete("/notes/:id", async(req,res)=>{
    const id=req.params.id
    await Note.findByIdAndDelete(id);
    res.status(200).json({
        message:"note deleted successfully"
    })
})
app.patch("/notes/:id", async(req,res)=>{
    const id=req.params.id
    const data=req.body;
    await Note.findByIdAndUpdate(id,data);
    res.status(200).json({
        message:"note updated successfully",
        data
    })
})


module.exports=app;