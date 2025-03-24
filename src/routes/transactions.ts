import { FastifyInstance } from "fastify";
import { db } from "../database";
import { z } from "zod";
import crypto from "node:crypto";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const transactions = await db("transactions").select()

    return { transactions }
  })

  app.get("/:id", async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const transaction = await db("transactions").where("id", id).first()

    return { transaction }
  })

  app.get("/summary", async () => {
    const summary = await db("transactions").sum("amount", { as: "Amount"}).first()

    return { summary }
  })

  app.post("/", async (request, response) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    );

    await db("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
    });

    return response.status(201).send("Transação concluída com sucesso");
  });
}
