import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import moment from "moment";

const bots = [
  "promachao",
  "PromocoesGPU",
  "pcdofafapromo",
  "pcbuildwizard",
  "grupodosbets",
  "EconoMister",
  "pcgamerbarato",
  "gpubipolar",
  "gpubipolar_monitores",
];

const apiId = 23056821;
const apiHash = "db05b4762c0bb199cfa00b1bd54d47f2";
const stringSession = new StringSession(
  "1AQAOMTQ5LjE1NC4xNzUuNTEBuyu4y8rvpcoZmB67Mxrorhd+Bj8dZq8WdPlxgTFfj3AwNQnYifYsVHTbdaLAHRI9KlbosurOWlo7+2UukqknjLSNFkgcJDaUbJ6aXaoPQAA5Ki2vX+lVCiHNxgpEKCIoJx/jKf4KMoqHjZWSiPbA+DHZE5Hg6NBFmtaGN4qr+bwl7PeQBlIjRbKczju/2ruL6c+q+DafKsmsSjwFRQ6Q8QO5x4yj7ZP7xuGOqHRTdlAzwAXyWw2WCQOFHhioYGX6Ee5ykWDUzridIHANzB3vrIqqmEVeX737QTu9HCBqy8sWef5cSOA+SRhAliwJfrhmqu2mPeZU44ixp+Fh+BtKM4k="
);

(async () => {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
  });

  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.text("password?"),
    phoneCode: async () => await input.text("Code ?"),
    onError: (err) => console.log(err),
  });

  whatsappClient.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("ready", () => {
    console.log("Client is ready!");
  });

  whatsappClient.on("message", async (message) => {
    if (message.body.includes("!.")) {
      let chats = [];
      const [, q] = message.body.split("!.");

      console.log("q", q);

      for await (const bot of bots) {
        console.log("bots", bot);
        const result = await client.invoke(
          new Api.messages.Search({
            peer: bot,
            q,
            filter: new Api.InputMessagesFilterPhotos({}),
            limit: 20,
            // maxDate: moment().unix(),
            // minDate: moment().subtract(5, "days").unix(),
          })
        );

        chats = [
          ...chats,
          {
            bot,
            promotions: result.messages.length
              ? result.messages.flatMap((message) => message.message)
              : undefined,
          },
        ];
      }

      const author = message.author || message.from;

      if (chats.every((r) => !r.promotions)) {
        return;
      }

      whatsappClient.sendMessage(
        author,
        `Promoções - ${moment().format("DD/MM/YYYY HH:mm:ss")}
Buscando em: ${bots.join(", ")}
⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️        `
      );

      console.log("chat", chats);

      const onlyValidPromotions = chats.filter((chat) => chat.promotions);

      if (onlyValidPromotions.length)
        onlyValidPromotions.forEach((chat) =>
          whatsappClient.sendMessage(
            author,
            chat.promotions && chat.promotions.map((promo) => promo).join("/n")
          )
        );
    }
  });

  whatsappClient.initialize();

  console.log("You should now be connected.");
  console.log(client.session.save());
})();
