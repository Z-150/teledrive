"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V1 = void 0;
const express_1 = require("express");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("./Auth");
const Config_1 = require("./Config");
const Dialogs_1 = require("./Dialogs");
const Files_1 = require("./Files");
const Messages_1 = require("./Messages");
const Users_1 = require("./Users");
const Utils_1 = require("./Utils");
exports.V1 = (0, express_1.Router)()
    .use(Endpoint_1.Endpoint.register(Auth_1.Auth, Users_1.Users, Files_1.Files, Dialogs_1.Dialogs, Messages_1.Messages, Utils_1.Utils, Config_1.Config));
//# sourceMappingURL=index.js.map