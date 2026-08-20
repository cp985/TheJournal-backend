import { type Request, type Response, type NextFunction } from "express";
import { prisma  } from "../db/client.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabaseClient.js";
import {Resend} from 'resend';import { jwtDecrypt } from "jose";
import crypto from "crypto";
const resend = new Resend(process.env.RESEND_TOKEN);
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
    if (!usersList || usersList.length === 0) {
      return res.status(404).json({
        message: "no-users-found",
      });
    }
    res.status(200).json(
      usersList
    );
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//user patch

export const usersPatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, email, oldPassword, newPassword, avatar } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        message: "email-required",
      });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "no-user-found",
      });
    }

    const dataToUpdate: { username?: string; password?: string; avatar?: string  } = {};

    if (username) {
      dataToUpdate.username = username;
    }

    if (avatar) {
      dataToUpdate.avatar = avatar;
    }

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({
          message: "old-password-required",
        });
      }

      if (!existingUser.password) {
        return res.status(400).json({
          message: "oauth-user-cannot-change-password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        existingUser.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "invalid-old-password",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: dataToUpdate,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      message: "user-updated-successfully",
      user: userWithoutPassword,
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

//user delete



export const usersDelete = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "user-not-authenticated-correctly" });
    }

    const shortHash = crypto.randomBytes(3).toString("hex"); // es. "a9f2b8"
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const anonymousUsername = `Anonimo_${dateStr}_${shortHash}`;

    const anonymousEmail = `deleted_${userId}@deleted.local`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: anonymousUsername,
        email: anonymousEmail,
      },
    });

    res.clearCookie("session_token");

    return res.status(200).json({ 
      message: "account-deleted",
      anonymizedAs: anonymousUsername 
    });
  } catch (error) {
    console.error("Error during user anonymization:", error);
    return res.status(500).json({ message: "internal-server-error" });
  }
};

//delete user admin
export const userDeleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try{const userId= req.body.userId
if(!userId){
  return res.status(400).json({message: "user-not-found"})
}
const deletedUser = await prisma.user.delete({
  where: {id: userId}
})

if(!deletedUser){
  return res.status(404).json({message: "user-not-found"})
}
return res.status(200).json({
  message: "user-deleted-successfully",
  user: deletedUser
})


  }
  catch(e){
    console.error(e)
    return res.status(500).json({message: "internal-server-error"})
  }
}

//role update admin



export const adminUpdateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as { id: string; role: string };
    if (user?.role !== "ADMIN") {
      return res.status(403).json({ message: "forbidden-admin-only" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId-required" });
    }

    const existUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existUser) {
      return res.status(404).json({ message: "user-not-found" });
    }

    const newRole = existUser.role === "ADMIN" ? "USER" : "ADMIN";

    if (userId === user.id && newRole !== "ADMIN") {
      return res.status(400).json({ message: "cannot-demote-yourself" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, username: true, role: true },
    });

    return res.status(200).json({
      message: "user-role-toggled-successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "internal-server-error" });
  }
};

//user export data
export const exportUserData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "user-not-authenticated" });
    }

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        evidence: true, 
      },
    });

    if (!userData) {
      return res.status(404).json({ message: "user-not-found" });
    }

    const fileName = `data-export-${userId}-${Date.now()}.json`;
    const jsonContent = JSON.stringify(userData, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.status(200).send(jsonContent);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "internal-server-error" });
  }
};


//user by email

export const usersByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const email = req.body.email;
  try {

    const user = await prisma.user.findUnique({where:{email: email},
    select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true
      },});
    if (!user ) {
      return res.status(404).json({
        message: "No users found",
      });
    }

  
    res.status(200).json({
      message: "user-found",
      user,
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
        message: "no-user-found",
      });
    }

const existUsername = await prisma.user.findUnique({where:{username: newUser.username}});
const existEmail = await prisma.user.findUnique({where:{email: newUser.email}});

if(existUsername){
  return res.status(409).json({
    message: "username-already-exist",
  });
}
if(existEmail){
  return res.status(409).json({
    message: "email-already-exist",
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

    const address = newUser.email;
const username = newUser.username;
const lang = newUser.lang;

const itaHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ CONFERMA REGISTRAZIONE :: THEJOURNAL ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Benvenuto/a, ${username}
      </h1>
    </div>

    <!-- Body -->
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        La registrazione del tuo account su <strong style="color: #f4f4f5;">TheJournal</strong> è avvenuta con successo. Il tuo profilo è ora attivo e pronto all'uso.
      </p>
      <p>
        <strong>TheJournal</strong> è una piattaforma indipendente di divulgazione. Tutti i contenuti e le notizie pubblicati vengono accuratamente rielaborati e sintetizzati al solo scopo informativo e divulgativo, nel pieno rispetto delle normative sul copyright e dei diritti d'autore.
      </p>

      <!-- Security Notice Box -->
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ AVVISO DI SICUREZZA
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          Nessun operatore del nostro team ti chiederà mai la password o le tue credenziali di accesso tramite email. Non condividere mai i tuoi dati riservati con terzi.
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Messaggio generato automaticamente dal sistema di registrazione di TheJournal. Non rispondere direttamente a questa email di notifica.
      </p>
    </div>

  </div>
</div>`;

const engHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ REGISTRATION CONFIRMATION :: THEJOURNAL ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Welcome, ${username}
      </h1>
    </div>

    <!-- Body -->
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        Your account registration on <strong style="color: #f4f4f5;">TheJournal</strong> has been successfully completed. Your profile is now active and ready to use.
      </p>
      <p>
        <strong>TheJournal</strong> is an independent outreach and educational platform. All published content and news are carefully processed and synthesized for informational purposes only, adhering strictly to copyright and fair use guidelines.
      </p>

      <!-- Security Notice Box -->
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ SECURITY WARNING
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          No staff member will ever ask for your password or personal credentials via email. Never disclose your private account details to anyone.
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Automated message generated by TheJournal registration system. Please do not reply directly to this notification.
      </p>
    </div>

  </div>
</div>`;

await resend.emails.send({
  from: "TheJournal Staff <onboarding@resend.dev>",
  to: address,
  subject: lang === "IT" ? "Registrazione su TheJournal" : "Registration on TheJournal",
  html: lang === "IT" ? itaHtml : engHtml ,
  text:'Benvenuto su TheJournal - You are welcome to TheJournal!',
})

const createdUser={
  username:user.username,
  email:user.email,
  role:user.role
}


    res.status(201).json({
      message: "user-signed-up",
      createdUser,
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
        message: "no-user-found",
      });
    }

const existUser = await prisma.user.findUnique({where:{email: user.email}});


if(!existUser){
  return res.status(401).json({
    message: "wrong-email",
  });
}

if(!existUser.password){
  return res.status(401).json({
    message: "wrong-password",
  });
}
const existPassword = await bcrypt.compare(user.password, existUser.password);


if(!existPassword){
  return res.status(401).json({
    message: "wrong-password",
  });
}



    const 
      data = {
        id: existUser.id,
        username:existUser.username,
        email: existUser.email,
        role: existUser.role,
        avatar: existUser.avatar
      }
    

    res.status(200).json({
      message: "user-logged-in",
      data,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//user oauth



export async function usersOAuthSync(req: Request, res: Response, next: NextFunction) {
  const { email, provider, image } = req.body; 

  if (!email) {
    return res.status(400).json({ message: "email-required" });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
      let finalUsername = `${baseUsername}_${provider || "oauth"}`;

      let isUsernameTaken = await prisma.user.findUnique({
        where: { username: finalUsername },
      });

      while (isUsernameTaken) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        finalUsername = `${baseUsername}_${provider || "oauth"}_${randomSuffix}`;
        
        isUsernameTaken = await prisma.user.findUnique({
          where: { username: finalUsername },
        });
      }

      user = await prisma.user.create({
        data: {
          email: email,
          username: finalUsername,
          provider: provider || "oauth",
          password: null,
          role: "USER",
          avatar: image || null, 
        },
      });
      const address = user.email;
      const username = user.username;
      const lang = "IT";

      const itaHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ CONFERMA REGISTRAZIONE :: THEJOURNAL ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Benvenuto/a, ${username}
      </h1>
    </div>
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        La registrazione del tuo account su <strong style="color: #f4f4f5;">TheJournal</strong> è avvenuta con successo. Il tuo profilo è ora attivo e pronto all'uso.
      </p>
      <p>
        <strong>TheJournal</strong> è una piattaforma indipendente di divulgazione. Tutti i contenuti e le notizie pubblicati vengono accuratamente rielaborati e sintetizzati al solo scopo informativo e divulgativo, nel pieno rispetto delle normative sul copyright e dei diritti d'autore.
      </p>
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ AVVISO DI SICUREZZA
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          Nessun operatore del nostro team ti chiederà mai la password o le tue credenziali di accesso tramite email. Non condividere mai i tuoi dati riservati con terzi.
        </span>
      </div>
    </div>
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Messaggio generato automaticamente dal sistema di registrazione di TheJournal. Non rispondere direttamente a questa email di notifica.
      </p>
    </div>
  </div>
</div>`;

      const engHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ REGISTRATION CONFIRMATION :: THEJOURNAL ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Welcome, ${username}
      </h1>
    </div>
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        Your account registration on <strong style="color: #f4f4f5;">TheJournal</strong> has been successfully completed. Your profile is now active and ready to use.
      </p>
      <p>
        <strong>TheJournal</strong> is an independent outreach and educational platform. All published content and news are carefully processed and synthesized for informational purposes only, adhering strictly to copyright and fair use guidelines.
      </p>
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ SECURITY WARNING
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          No staff member will ever ask for your password or personal credentials via email. Never disclose your private account details to anyone.
        </span>
      </div>
    </div>
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Automated message generated by TheJournal registration system. Please do not reply directly to this notification.
      </p>
    </div>
  </div>
</div>`;

      resend.emails
        .send({
          from: "TheJournal Staff <onboarding@resend.dev>",
          to: address,
          subject: lang === "IT" ? "Registrazione su TheJournal" : "Registration on TheJournal",
          html: lang === "IT" ? itaHtml : engHtml,
          text: "Benvenuto su TheJournal - You are welcome to TheJournal!",
        })
        .catch((emailError) => {
          console.error("Errore invio email Resend (background):", emailError);
        });
    



    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar ?? null,
      },
    });
  } catch (error) {
    console.error("Errore OAuth sync backend:", error);
    return res.status(500).json({ message: "connection-error" });
  }
}

//dossiers



export const dossiersGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user; 
    const isAuthenticated = !!user;

    const dossiersList = await prisma.dossier.findMany({
      ...(!isAuthenticated && { take: 3 }), 
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
    return res.status(200).json(dossiersList || []);
   
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

export const evidencesGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const evidencesList = await prisma.evidence.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    return res.status(200).json(evidencesList || []);
   
  } catch (e) {
    console.log(e);
    next(e);
  }
};


export const evidencesPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "user-not-authenticated" });
    }

    const user = await prisma.user.findUnique({
      
      where: { id: userId },
      select: { username: true },
      
    });

    const authorName = user?.username ||  "Anonimous";

    const file = req.file; 
    const { dossierId, type, notes} = req.body;

    if (!file) {
      return res.status(400).json({ message: "file-missing" });
    }

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pending-storage") 
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);
      return res.status(500).json({ message: "file-upload-failed" });
    }

    const { data: publicUrlData } = supabase.storage
      .from("evidences")
      .getPublicUrl(uploadData.path);

    const fileUrl = publicUrlData.publicUrl;

    const evidence = await prisma.evidence.create({
      data: {
        dossierId,
        type,
        fileUrl,
        notes: notes || null,
      
        status: "PENDING",
        author: userId,
      },
    });

    return res.status(201).json({
      message: "new-evidence-created",
      evidence,
      fileName: fileUrl, 
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

export const evidencesByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "user-not-authenticated" });
    }

    const evidencesList = await prisma.evidence.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        author: userId,
      },
    });

    return res.status(200).json(evidencesList || []);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

//email contact 

export const emailResend= async (req: Request, res: Response, next: NextFunction) => {
  try {

    const userContact = req.body;

    if (!userContact) {
      return res.status(400).json({
        message: "no-text-found",
      });
    }

    const existUser = await prisma.user.findUnique({where:{email: userContact.email}});

    if(!existUser){
      return res.status(401).json({
        message: "email-not-found",
      });
    }

const address = userContact.email;
const subject = userContact.subject;
const text = userContact.textarea;
const username = existUser.username;
const lang = userContact.lang;
const idForm = Date.now().toString();


const itaHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-w: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ CONFERMA RICEZIONE :: ID TICKET #TRX-${idForm} ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Segnalazione Ricevuta
      </h1>
    </div>

    <!-- Body -->
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        Ti confermiamo che la tua trasmissione è stata acquisita dai nostri sistemi ed è attualmente in fase di elaborazione.
      </p>
      <p>
        Il nostro team analizzerà la richiesta e provvederà a risponderti nel più breve tempo possibile a questo indirizzo email.
      </p>

      <!-- Security Notice Box -->
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ AVVISO DI SICUREZZA
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          Nessun operatore del nostro team ti chiederà mai la tua password o credenziali personali tramite email. Non condividere dati sensibili in risposta a questo messaggio.
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Messaggio generato automaticamente dal sistema di trasmissione. Non rispondere direttamente a questa email di notifica.
      </p>
    </div>

  </div>
</div>`
const engHtml = `<div style="background-color: #09090b; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 32px 16px; min-height: 100%;">
  <div style="max-w: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 24px;">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #f59e0b; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">
        [ RECEIPT CONFIRMATION :: TICKET ID #TRX-${idForm} ]
      </span>
      <h1 style="color: #f4f4f5; font-size: 20px; font-weight: bold; margin-top: 8px; margin-bottom: 0;">
        Report Received
      </h1>
    </div>

    <!-- Body -->
    <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
      <p style="margin-top: 0;">
        We confirm that your transmission has been acquired by our systems and is currently being processed.
      </p>
      <p>
        Our team will review your inquiry and respond to this email address shortly.
      </p>

      <!-- Security Notice Box -->
      <div style="background-color: #09090b; border-left: 2px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <span style="color: #f59e0b; font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">
          ⚠ SECURITY WARNING
        </span>
        <span style="font-size: 12px; color: #a1a1aa;">
          No staff member will ever ask for your password or personal account credentials via email. Do not disclose sensitive information in reply to this message.
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: justify;">
      <p style="margin: 0;">
        Automated message generated by transmission node. Please do not reply directly to this notification.
      </p>
    </div>

  </div>
</div>`

await resend.emails.send({
  from: "TheJournal Staff <onboarding@resend.dev>",
  to: address,
  subject: lang === "IT" ? "Conferma ricezione segnalazione" : "Report receipt confirmation",
  html: lang === "IT" ? itaHtml : engHtml ,
  text:'Segnalazione Ricevuta - Report Received',
})

    res.status(200).json({
      message: "email-sent",
    }); 
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//soft auth middleware dossier





export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("AUTH HEADER RICEVUTO:", authHeader); // 👈 arriva l'header?

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    (req as any).user = undefined;
    return next();
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

  if (!token || !secret) {
    console.log("TOKEN O SECRET MANCANTI", { token: !!token, secret: !!secret });
    (req as any).user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log("TOKEN VERIFICATO CON SUCCESSO:", decoded); // 👈 arriva qui?
    (req as any).user = decoded;
  } catch (error) {
    console.log("JWT VERIFY FALLITO:", error); // 👈 il pezzo mancante — perché fallisce?
    (req as any).user = undefined;
  }

  next();
};

//token jwt check



export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | undefined;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token-not-found" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("jwt-secret-not-set");
    return res.status(500).json({ message: "jwt-secret-not-set" });
  }

  try {
    const decoded = jwt.verify(token, secret) as { sub: string; email?: string };

    req.user = {
      id: decoded.sub,
      ...(decoded.email ? { email: decoded.email } : {}),
    };

    next();
  } catch (error: any) {
    console.error("Error:", error.message);
    return res.status(403).json({ message: "not-valid-token" });
  }
};


//admin middleware


export interface AuthenticatedRequestAdmin extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
}

export const authenticateAdminToken = (
  req: AuthenticatedRequestAdmin,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token-not-found" });
  }

  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    console.error("jwt-secret-not-set");
    return res.status(500).json({ message: "jwt-secret-not-set" });
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email?: string;
      role?: string;
    };

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "access-denied-admin-only" });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      ...(decoded.email ? { email: decoded.email } : {}),
    };

    next();
  } catch (error: any) {
    console.error("Error:", error.message);
    return res.status(403).json({ message: "not-valid-token" });
  }
};

//health check
export const healthGet = async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({ 
      status: "online", 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "offline", 
      error: "db-error-offline" 
    });
  }
}