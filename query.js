"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("@/lib/prisma");
var users = await prisma_1.default.user.findMany({
    where: {
        firstName: { endsWith: "prisma.io" }
    },
});
