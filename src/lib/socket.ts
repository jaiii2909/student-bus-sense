import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

// Socket that receives `busUpdate` events the server lets this token see.
export const connectBusSocket = (token: string) => io(SOCKET_URL, { auth: { token } });
