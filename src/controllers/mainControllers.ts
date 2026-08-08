import { type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/client.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

export const homeGet = (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World from the journal!",
  });
};

// users all
export const usersGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usersList = await prisma.user.findMany();
    console.log(usersList);
    if (!usersList || usersList.length === 0) {
      return res.status(404).json({
        message: "No users found",
      });
    }
    res.status(200).json({
      message: "Hello World from the journal userslist!",
      usersList,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//user sign up

export const usersSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = req.body;

    if (!newUser) {
      return res.status(400).json({
        message: "No user created",
      });
    }

const existUsername = await prisma.user.findUnique({where:{username: newUser.username}});
const existEmail = await prisma.user.findUnique({where:{email: newUser.email}});

if(existUsername){
  return res.status(409).json({
    message: "Username already exist",
  });
}
if(existEmail){
  return res.status(409).json({
    message: "Email already exist",
  });
}
const hashPassword = await bcrypt.hash(newUser.password, 12);
    const user = await prisma.user.create({
      data: {
        username: newUser.username,
        email: newUser.email,
        password: hashPassword,
      },
    });
    console.log(user);

    console.log(newUser);

    res.status(201).json({
      message: "New user created",
      newUser,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//user login

export const usersLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.body;

    if (!user) {
      return res.status(400).json({
        message: "No user",
      });
    }

const existUser = await prisma.user.findUnique({where:{email: user.email}});


if(!existUser){
  return res.status(401).json({
    message: "Wrong Credentials",
  });
}
const existPassword = await bcrypt.compare(user.password, existUser.password);


if(!existPassword){
  return res.status(401).json({
    message: "Wrong Credentials",
  });
}



    const 
      data = {
        username:existUser.username,
        email: existUser.email,
        role: existUser.role
      }
    
    console.log(user);
console.log(data);

    res.status(200).json({
      message: "User logged in",
      data,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//dossiers

export const dossiersGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const dossierLimit = req.body.limit ? Number(req.body.limit)  : undefined;
  
    const dossiersList = await prisma.dossier.findMany({
      include: {
        take : (dossierLimit && !isNaN(dossierLimit)) ? dossierLimit : undefined,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        evidences: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
    if (!dossiersList || dossiersList.length === 0) {
      return res.status(400).json({
        message: "No dossiers found",
      });
    }
    res.status(201).json(
    
    dossiersList
    );
  } catch (e) {
    console.log(e);
    next(e);
  }
};






export const dossiersPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newDossier = req.body;

    if (!newDossier) {
      return res.status(409).json({
        message: "No dossier created",
      });
    }
    const dossier = await prisma.dossier.create({
      data: {
        code: newDossier.code,
        coverUrl: newDossier.coverUrl,
        title: newDossier.title,
        title_en: newDossier.tite_en,
        description: newDossier.description,
        description_en: newDossier.description_en,
        author: newDossier.author,
      },
    });


    res.status(201).json({
      message: "New dossier created!",
      newDossier,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//evidences

export const evidencesPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newEvidence = req.body;

    if (!newEvidence) {
      return res.status(409).json({
        message: "No evidence created",
      });
    }
    const evidence = await prisma.evidence.create({
      data: {
        dossierId: newEvidence.dossierId,
        type: newEvidence.type,
        fileUrl: newEvidence.fileUrl,
        notes: newEvidence.notes,
        notes_en: newEvidence.notes_en,
        status: newEvidence.status,
        author: newEvidence.author,
      },
    });


    res.status(201).json({
      message: " New evidence created!",
      evidence,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
