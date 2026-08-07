import { io } from "socket.io-client";
// const local_url = "http://localhost:5000";
const production_url = "https://realtime-backend-673j.onrender.com";

export const socket = io(`${production_url}`, {
    transports: ["websocket"],
});
