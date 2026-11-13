export default {
  name: "ping",
  desc: "Bot Check",
  execute: async (sock, m, {from}) => {
    await sock.sendMessage(from, {text: "💜 PONG! ARSLAN MD Chal Raha Hai!"});
  }
};
