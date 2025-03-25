import { FastifyInstance } from "fastify";
import { db } from "../database";
import { z } from "zod";
import crypto from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {

  app.get("/", {
    preHandler: [checkSessionIdExists]
  },
    async (request, response) => {

      const { sessionId } = request.cookies

      const transactions = await db("transactions").select().where("session_id", sessionId)

      return { transactions }
    })

  app.get("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const transaction = await db("transactions").where({ session_id: sessionId, id: id })

    return { transaction }
  })

  app.get("/summary", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {

    const { sessionId } = request.cookies

    const summary = await db("transactions")
      .sum("amount", { as: "Amount" })
      .where("session_id", sessionId)
      .first()

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

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      response.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days,    
      })
    }

    await db("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });

    return response.status(201).send("Transação concluída com sucesso");
  });
}
