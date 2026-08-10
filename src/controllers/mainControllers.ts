import { type Request, type Response, type NextFunction } from "express";
import { prisma  } from "../db/client.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {Resend} from 'resend';
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
const existPassword = await bcrypt.compare(user.password, existUser.password);


if(!existPassword){
  return res.status(401).json({
    message: "wrong-password",
  });
}



    const 
      data = {
        username:existUser.username,
        email: existUser.email,
        role: existUser.role
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

//dossiers

export const dossiersGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const dossierLimit = req.query.limit && (!isNaN(Number(req.query.limit))) ? Number(req.query.limit) : undefined;

    const optionsQuery  = {
      ...(dossierLimit && {take:dossierLimit}),
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
    }

    if(dossierLimit){
      optionsQuery.take = dossierLimit
    }
    const dossiersList = await prisma.dossier.findMany(optionsQuery);
    if (!dossiersList || dossiersList.length === 0) {
      return res.status(200).json([]);
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