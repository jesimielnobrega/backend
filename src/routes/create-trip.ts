import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trip",
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email(),
        }),
      },
    },
    async (request) => {
      const { destination, ends_at, starts_at, owner_email, owner_name } =
        request.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error("Ivalid trip start date.");
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error("Ivalid trip end date.");
      }

      const mail = await getMailClient();

      const message = await mail.sendMail({
        from: {
          name: "Equipe Planner",
          address: "teste@planner",
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: "Testando o envio de email",
        html: `<strong>Teste de envio de email</strong>`,
      });

      console.log(nodemailer.getTestMessageUrl(message));

      const trip = await prisma.trip.create({
        data: {
          destination,
          ends_at,
          starts_at,
        },
      });

      return { tripId: trip.id };
    }
  );
}
