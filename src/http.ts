/**
 * `klee-http-api`
 * 🔹 A lightweight Express server for handling HTTP requests related to Klee's economy system and GitHub webhook events.
 *
 * This server provides two main functionalities:
 * 1. Migration API (MAPI)
 * 2. GitHub Webhook Handler (KGWH)
 * 
 * MAPI allows authorized clients to migrate user balances from another bot economy to Lúminas. Each migration request is unique and properly authenticated so that only valid requests are processed!
 * 
 * KGWH listens for push events from the bot specified GitHub repository and sets a flag to indicate that an update is pending, allowing the bot to react accordingly.
 *  
 * 'http.ts' includes a simple testing endpoint to verify that the API is running.
 * 
 * Unless you're developing the other bot, you *probably* won't need to interact with the migration endpoint directly, but it's there if you need it :u
 * 
 * Still, the GitHub webhook handler is there to allow the bot to automatically detect new commits and trigger updates without manual intervention!
 * BTW, you need to create an GitHu webhook pointing to `https://your-server.com/github-webhook` with the secret you set in `GITHUB_WEBHOOK_SECRET` and subscribe to push events for it to work!
 * Feel free to create an issue if you have any questions or need help setting it up! :D
 * 
 * Note: You will need the necessary environment variables (`JAZZ_MIGRATION_SECRET` and `GITHUB_WEBHOOK_SECRET`) set for the HTTP API to function correctly.
 * JAZZ_MIGRATION_SECRET can be any random string used to authenticate migration requests
 * 
 * Enjoy! :D
 */
import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";

import { prisma } from "../../lib/prisma";

dotenv.config();

const app = express();
app.use(express.json());

export const updateStatus = {
  isUpdatePending: false,
};

/**
 * Migration API (Jazzcoins to Klee Coins)
 */
app.post("/api/migrate/jazzcoins", async (req, res) => {
  try {
    const auth = req.headers.authorization;

    if (auth !== `Bearer ${process.env.JAZZ_MIGRATION_SECRET}`) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { userId, amount, requestId } = req.body;

    if (!userId || !amount || !requestId) {
      return res.status(400).json({
        error: "[400] | com.klee.http-api | Campos obrigatórios ausentes",
      });
    }

    if (
      typeof amount !== "number" ||
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      return res
        .status(400)
        .json({ error: "[400] | com.klee.http-api | Quantidade inválida" });
    }

    const existingMigration = await prisma.coinMigration.findUnique({
      where: { requestId },
    });

    if (existingMigration) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.coinMigration.create({
        data: {
          requestId,
          source: "jazzghost",
          userId,
          amount: BigInt(amount),
        },
      });

      await tx.economy.upsert({
        where: { userId },
        update: {
          wallet: {
            increment: BigInt(amount),
          },
        },
        create: {
          userId,
          wallet: BigInt(amount),
        },
      });
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(
      "[com.klee.http-api]: error while migrating economy system:",
      error,
    );
    return res.status(500).json({
      error: "[500] | com.klee.http-api | Erro interno ao migrar moedas",
    });
  }
});

/**
 * GitHub Webhook Handler
 */
app.post("/github-webhook", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const event = req.headers["x-github-event"];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(
      "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex"),
      "utf8",
    );
    const checksum = Buffer.from(signature as string, "utf8");

    if (
      checksum.length !== digest.length ||
      !crypto.timingSafeEqual(digest, checksum)
    ) {
      console.warn("[com.klee.http-api]: Unauthorized webhook attempt.");
      return res.status(401).send("Invalid signature");
    }
  }

  if (event === "push") {
    console.log("[com.klee.http-api]: New commit detected. Bot is updating...");
    updateStatus.isUpdatePending = true;
  }

  res.status(200).send("OK");
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export { app };
