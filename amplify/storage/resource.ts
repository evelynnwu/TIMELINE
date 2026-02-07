import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "artfolioMedia",
  access: (allow) => ({
    // Public read for all media, authenticated users can write/delete
    "media/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
