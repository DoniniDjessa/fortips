import nodemailer from "nodemailer";

// Email configuration
const EMAIL_CONFIG = {
  service: "gmail",
  user: "doninidjessa@gmail.com",
  appPassword: "bjju pwdd zozr nlye".replace(/\s/g, ""), // Remove spaces from app password
};

// Create transporter
const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.appPassword,
  },
});

export type PredictionEmailData = {
  userPseudo: string | null;
  userEmail: string | null;
  sport: string;
  competition: string;
  matchName: string;
  date: string;
  time: string;
  odds: number;
  predictionText: string;
  probableScore: string | null;
  details: string | null;
};

export async function sendNewPredictionEmail(data: PredictionEmailData) {
  try {
    const userName = data.userPseudo || data.userEmail || "Utilisateur";
    const matchDate = new Date(`${data.date}T${data.time}`).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c7be5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 Nouveau Pronostic en Attente</h2>
            </div>
            <div class="content">
              <p>Un nouveau pronostic a été soumis et nécessite votre validation.</p>
              
              <div class="info-row">
                <span class="label">Utilisateur:</span>
                <span class="value">${userName}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Sport:</span>
                <span class="value">${data.sport}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Compétition:</span>
                <span class="value">${data.competition}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Match:</span>
                <span class="value">${data.matchName}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Date et Heure:</span>
                <span class="value">${matchDate}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Cote:</span>
                <span class="value">${data.odds.toFixed(2)}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Prédiction:</span>
                <span class="value">${data.predictionText}</span>
              </div>
              
              ${data.probableScore ? `
              <div class="info-row">
                <span class="label">Score Probable:</span>
                <span class="value">${data.probableScore}</span>
              </div>
              ` : ""}
              
              ${data.details ? `
              <div class="info-row">
                <span class="label">Détails:</span>
                <span class="value">${data.details}</span>
              </div>
              ` : ""}
              
              <div class="footer">
                <p>Connectez-vous à l'interface d'administration pour valider ou rejeter ce pronostic.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Nouveau Pronostic en Attente

Un nouveau pronostic a été soumis et nécessite votre validation.

Utilisateur: ${userName}
Sport: ${data.sport}
Compétition: ${data.competition}
Match: ${data.matchName}
Date et Heure: ${matchDate}
Cote: ${data.odds.toFixed(2)}
Prédiction: ${data.predictionText}
${data.probableScore ? `Score Probable: ${data.probableScore}` : ""}
${data.details ? `Détails: ${data.details}` : ""}

Connectez-vous à l'interface d'administration pour valider ou rejeter ce pronostic.
    `;

    const mailOptions = {
      from: EMAIL_CONFIG.user,
      to: EMAIL_CONFIG.user, // Send to admin email
      subject: `📊 Nouveau Pronostic - ${data.matchName}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

