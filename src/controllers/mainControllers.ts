import { type Request, type Response, type NextFunction } from "express";
import {prisma} from "../db/client.js";
import dotenv from 'dotenv';
dotenv.config();

export const homeGet = (req : Request, res : Response) => {
    res.status(200).json({
        message: "Hello World from the journal!"
    });
}

export const usersGet = async (req : Request, res : Response, next : NextFunction) => {
    try{

            const usersList = await prisma.user.findMany();
    console.log(usersList);
    if(!usersList || usersList.length === 0) {
        return res.status(404).json({
            message: "No users found"
        });
    }
    res.status(200).json({
        message: "Hello World from the journal userslist!",
        usersList
    });
    }
    catch(e) {
        console.log(e);
        next(e);
    }

}

export const usersPost = async (req : Request, res : Response, next : NextFunction) => {
    try{
        const newUser= req.body;

            if(!newUser) {
        return res.status(404).json({
            message: "No user created"
        });
    }
        const user = await prisma.user.create({
            data: {
                username: newUser.username,
                email: newUser.email,
                password: newUser.password
            }
        });
        console.log(user);

    console.log(newUser);

    res.status(200).json({
        message: "Hello World from the journal newUser!",
        newUser
    });
    }
    catch(e) {
        console.log(e);
        next(e);
    }

}