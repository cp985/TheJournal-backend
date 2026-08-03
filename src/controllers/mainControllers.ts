import { type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/client.js";
import dotenv from "dotenv";
dotenv.config();

export const homeGet = (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World from the journal!",
  });
};

// users
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

export const usersPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = req.body;

    if (!newUser) {
      return res.status(404).json({
        message: "No user created",
      });
    }
    const user = await prisma.user.create({
      data: {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      },
    });
    console.log(user);

    console.log(newUser);

    res.status(200).json({
      message: "Hello World from the journal newUser!",
      newUser,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const dossiersGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dossiersList = await prisma.dossier.findMany({
      include: {
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
    console.log(dossiersList);
    if (!dossiersList || dossiersList.length === 0) {
      return res.status(404).json({
        message: "No dossiers found",
      });
    }
    res.status(200).json({
      message: "Hello World from the journal dossiersList!",
      dossiersList,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// Dossiers

export const dossiersPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newDossier = req.body;

    if (!newDossier) {
      return res.status(404).json({
        message: "No dossier created",
      });
    }
    const dossier = await prisma.dossier.create({
      data: {
        code: newDossier.code,
        title: newDossier.title,
        title_en: newDossier.tite_en,
        description: newDossier.description,
        description_en: newDossier.description_en,
        author: newDossier.author,
      },
    });
    console.log(dossier);

    console.log(newDossier);

    res.status(200).json({
      message: "Hello World from the journal newDossier!",
      newDossier,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const evidencesPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newEvidence = req.body;

    if (!newEvidence) {
      return res.status(404).json({
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
    console.log(evidence);

    console.log(newEvidence);

    res.status(200).json({
      message: "Hello World from the journal newEvidences!",
      newEvidence,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
