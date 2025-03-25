import { test, beforeAll, afterAll, describe, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { execSync } from "node:child_process";

describe("Transactions routes", () => {
    beforeAll(async () => {

        await app.ready();

    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        execSync("npm run knex migrate:rollback --all")
        execSync("npm run knex migrate:latest")
    })

    test("User can create a new transaction", async () => {
        const response = await request(app.server)
            .post("/transactions")
            .send({
                title: "Teste Transaction",
                amount: 5000,
                type: "credit",
            })
            .expect(201);
    });

    test("User should be able to list all transaction he made", async () => {
        const createTransactionResponse = await request(app.server)
            .post("/transactions")
            .send({
                title: "Teste Transaction",
                amount: 5000,
                type: "credit",
            })

        const cookies = createTransactionResponse.get("Set-Cookie");

        if (!cookies) {
            throw new Error("Cookies were not set in the response");
        }

        const listTransactionResponse = await request(app.server).get("/transactions")
            .set("Cookie", cookies)
            .expect(200);

        expect(listTransactionResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: "Teste Transaction",
                amount: 5000
            })
        ])
    })

    test("User should be able to list a specific transaction he made", async () => {
        const createTransactionResponse = await request(app.server)
            .post("/transactions")
            .send({
                title: "Teste Transaction",
                amount: 5000,
                type: "credit",
            });

        const cookies = createTransactionResponse.get("Set-Cookie");

        if (!cookies) {
            throw new Error("Cookies were not set in the response");
        }

        const listTransactionResponse = await request(app.server)
            .get("/transactions")
            .set("Cookie", cookies)
            .expect(200);

        const transactionId = listTransactionResponse.body.transactions[0].id;

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set("Cookie", cookies)
            .expect(200);

        expect(getTransactionResponse.body.transaction[0]).toEqual(
            expect.objectContaining({
                title: "Teste Transaction",
                amount: 5000,
            })
        );
    });

    test("User should be able to get the summary", async () => {
        const createTransactionResponse = await request(app.server)
            .post("/transactions")
            .send({
                title: "Teste Transaction",
                amount: 5000,
                type: "credit",
            });

        const cookies = createTransactionResponse.get("Set-Cookie");

        if (!cookies) {
            throw new Error("Cookies were not set in the response");
        }

        await request(app.server)
            .post("/transactions")
            .set("Cookie", cookies)
            .send({
                title: "Teste Transaction Debit",
                amount: 2000,
                type: "debit",
            });


        const summaryResponse = await request(app.server)
            .get("/transactions")
            .set("Cookie", cookies)
            .expect(200);

        const transactionId = summaryResponse.body.transactions[0].id;

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/sumamary`)
            .set("Cookie", cookies)
            .expect(200);

        expect(summaryResponse.body.summary).toEqual(
            expect.objectContaining({
                amount: 3000
            })
        );
    });
});

